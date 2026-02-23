#!/bin/bash
# =====================================================
# Live API Test: Diagram Pipeline + RAG Context
# Tests the deployed /api/chat/stream endpoint
# =====================================================
#
# Usage: ./scripts/test-live-api.sh [api-base-url]
# Default: https://elamurugan-api.rugan.workers.dev

API_BASE="${1:-https://elamurugan-api.rugan.workers.dev}"
SESSION_ID="test_diagram_$(date +%s)"
PASS=0
FAIL=0

echo ""
echo "=============================================="
echo "  LIVE API DIAGRAM + RAG TEST SUITE"
echo "  API: $API_BASE"
echo "  Session: $SESSION_ID"
echo "=============================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ---- Test Function ----
test_message() {
    local test_name="$1"
    local message="$2"
    local expect_diagram="$3"   # "yes" or "no"
    local expect_rag="$4"       # "yes" or "no"
    local check_no_cant="$5"    # "yes" = fail if response says "I can't create diagrams"

    echo ""
    echo "-----------------------------------------------"
    echo "TEST: $test_name"
    echo "  Message: \"$message\""
    echo "  Expect diagram: $expect_diagram | Expect RAG: $expect_rag"
    echo "-----------------------------------------------"

    # Call the non-streaming endpoint for easier parsing
    RESPONSE=$(curl -s -X POST "$API_BASE/api/chat" \
        -H "Content-Type: application/json" \
        -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"$message\"}" \
        --max-time 30)

    if [ -z "$RESPONSE" ]; then
        echo -e "  ${RED}FAIL: No response from API${NC}"
        FAIL=$((FAIL + 1))
        return
    fi

    # Check for success
    SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success', False))" 2>/dev/null)
    if [ "$SUCCESS" != "True" ]; then
        echo -e "  ${RED}FAIL: API returned error${NC}"
        echo "  Response: $(echo "$RESPONSE" | head -c 200)"
        FAIL=$((FAIL + 1))
        return
    fi

    # Extract fields
    HAS_DIAGRAM=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if d.get('diagram') else 'no')" 2>/dev/null)
    DIAGRAM_TYPE=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('diagram',{}).get('type','none'))" 2>/dev/null)
    DIAGRAM_TITLE=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('diagram',{}).get('title','none'))" 2>/dev/null)
    ASSISTANT_MSG=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('assistantMessage','')[:200])" 2>/dev/null)
    HAS_SOURCES=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('sources',[]); print('yes' if len(s)>0 else 'no')" 2>/dev/null)
    SOURCE_COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('sources',[])))" 2>/dev/null)

    echo "  Response preview: ${ASSISTANT_MSG:0:120}..."
    echo "  Has diagram: $HAS_DIAGRAM (type: $DIAGRAM_TYPE, title: $DIAGRAM_TITLE)"
    echo "  Has RAG sources: $HAS_SOURCES ($SOURCE_COUNT sources)"

    # Check diagram expectation
    local diagram_ok=true
    if [ "$expect_diagram" = "yes" ] && [ "$HAS_DIAGRAM" != "yes" ]; then
        echo -e "  ${RED}FAIL: Expected diagram but got none${NC}"
        diagram_ok=false
    fi
    if [ "$expect_diagram" = "no" ] && [ "$HAS_DIAGRAM" = "yes" ]; then
        echo -e "  ${YELLOW}WARN: Unexpected diagram generated (not necessarily bad)${NC}"
    fi

    # Check RAG expectation
    local rag_ok=true
    if [ "$expect_rag" = "yes" ] && [ "$HAS_SOURCES" != "yes" ]; then
        echo -e "  ${RED}FAIL: Expected RAG sources but got none${NC}"
        rag_ok=false
    fi

    # Check that AI doesn't say "I can't create diagrams"
    local cant_ok=true
    if [ "$check_no_cant" = "yes" ]; then
        CANT_CHECK=$(echo "$RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
msg = d.get('assistantMessage','').lower()
bad_phrases = ['can\\'t create', 'cannot create', 'can\\'t generate', 'cannot generate', 'can\\'t make visual', 'unable to create diagram']
found = [p for p in bad_phrases if p in msg]
print('FOUND: ' + ', '.join(found) if found else 'OK')
" 2>/dev/null)
        if [[ "$CANT_CHECK" == FOUND* ]]; then
            echo -e "  ${RED}FAIL: AI says it can't create diagrams! ($CANT_CHECK)${NC}"
            cant_ok=false
        fi
    fi

    if $diagram_ok && $rag_ok && $cant_ok; then
        echo -e "  ${GREEN}PASS${NC}"
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
    fi
}

# ---- Also test SSE streaming endpoint ----
test_stream_diagram() {
    local message="$1"
    echo ""
    echo "-----------------------------------------------"
    echo "STREAM TEST: Diagram via SSE"
    echo "  Message: \"$message\""
    echo "-----------------------------------------------"

    # Call streaming endpoint and collect all SSE events
    STREAM_RESPONSE=$(curl -s -X POST "$API_BASE/api/chat/stream" \
        -H "Content-Type: application/json" \
        -d "{\"sessionId\": \"${SESSION_ID}_stream\", \"message\": \"$message\"}" \
        --max-time 45)

    # Check for diagram event in SSE stream
    HAS_DIAGRAM_EVENT=$(echo "$STREAM_RESPONSE" | grep -c '"type":"diagram"' || true)
    HAS_END_EVENT=$(echo "$STREAM_RESPONSE" | grep -c '"type":"end"' || true)
    HAS_TOKEN_EVENT=$(echo "$STREAM_RESPONSE" | grep -c '"type":"token"' || true)
    HAS_META_EVENT=$(echo "$STREAM_RESPONSE" | grep -c '"type":"meta"' || true)

    echo "  SSE Events found:"
    echo "    meta: $HAS_META_EVENT | token: $HAS_TOKEN_EVENT | diagram: $HAS_DIAGRAM_EVENT | end: $HAS_END_EVENT"

    if [ "$HAS_DIAGRAM_EVENT" -gt 0 ]; then
        DIAGRAM_DATA=$(echo "$STREAM_RESPONSE" | grep '"type":"diagram"' | sed 's/^data: //')
        DTYPE=$(echo "$DIAGRAM_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('diagram',{}).get('type','?'))" 2>/dev/null)
        DTITLE=$(echo "$DIAGRAM_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('diagram',{}).get('title','?'))" 2>/dev/null)
        DSYNTAX_LEN=$(echo "$DIAGRAM_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('diagram',{}).get('syntax','')))" 2>/dev/null)
        echo "    Diagram type: $DTYPE | title: $DTITLE | syntax length: $DSYNTAX_LEN chars"
        echo -e "  ${GREEN}PASS: Diagram found in stream${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}FAIL: No diagram event in SSE stream${NC}"
        FAIL=$((FAIL + 1))
    fi

    if [ "$HAS_END_EVENT" -eq 0 ]; then
        echo -e "  ${RED}FAIL: No 'end' event in SSE stream${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# =====================================================
# RUN TESTS
# =====================================================

echo ""
echo "=== 1. DIAGRAM DETECTION + GENERATION ==="

test_message \
    "Payment system architecture (user's actual question)" \
    "how would you design a payment processing system for a high-scale ecommerce" \
    "yes" "yes" "yes"

test_message \
    "SAP integration architecture" \
    "How would you architect a SAP ECC integration with an eCommerce platform?" \
    "yes" "yes" "yes"

test_message \
    "Checkout flow diagram" \
    "What is the flow of a Magento checkout process with payment gateway?" \
    "yes" "yes" "yes"

test_message \
    "CI/CD pipeline design" \
    "How would you design a CI/CD pipeline for Kubernetes deployments?" \
    "yes" "yes" "yes"

echo ""
echo "=== 2. RAG CONTEXT VERIFICATION ==="

test_message \
    "Magento experience (should use RAG)" \
    "Tell me about your Magento experience and the stores you built" \
    "no" "yes" "no"

test_message \
    "Databricks experience (should use RAG)" \
    "What was your experience with Databricks and Spark?" \
    "no" "yes" "no"

echo ""
echo "=== 3. NO-DIAGRAM QUESTIONS ==="

test_message \
    "Simple greeting (no diagram expected)" \
    "Hello, who are you?" \
    "no" "no" "no"

echo ""
echo "=== 4. SSE STREAMING DIAGRAM TEST ==="

test_stream_diagram "how would you design a payment processing system for a high-scale ecommerce"

# =====================================================
# RESULTS
# =====================================================

echo ""
echo "=============================================="
echo "  RESULTS"
echo "=============================================="
TOTAL=$((PASS + FAIL))
echo -e "  ${GREEN}PASSED: $PASS${NC}"
echo -e "  ${RED}FAILED: $FAIL${NC}"
echo "  TOTAL:  $TOTAL"
echo "=============================================="

if [ "$FAIL" -gt 0 ]; then
    echo -e "\n${RED}Some tests failed! Check the output above.${NC}"
    exit 1
else
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
fi

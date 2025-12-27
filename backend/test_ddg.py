from duckduckgo_search import DDGS
import json

try:
    print("Attempting to search for 'cat'...")
    with DDGS() as ddgs:
        results = list(ddgs.images("cat", max_results=5))
    print(f"Found {len(results)} results.")
    print(json.dumps(results[:1], indent=2))
except Exception as e:
    print(f"Error: {e}")

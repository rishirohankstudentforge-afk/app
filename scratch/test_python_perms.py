import collections, itertools, json

test_cases = [
    ("abab", 2),
    ("babbaa", 3),
    ("abbababa", 3),
    ("babbbabaaa", 1),
    ("abaabbaababb", 3),
    ("aabbaaabbabbab", 2),
    ("baaabbbbbaababaa", 2),
    ("cdbeaaebdc", 3),
    ("adacbbcada", 4),
    ("aeaffffaea", 10),
    ("dfbfeefbfd", 3),
    ("fbacddcabf", 2),
    ("adcabbacda", 9),
    ("effcddcffe", 8),
    ("bfefddfefb", 5)
]

def solution(s, k):
    s = str(s)
    k = int(k)
    counts = collections.Counter(s)
    odd_chars = [ch for ch, cnt in counts.items() if cnt % 2 == 1]
    if len(odd_chars) > 1: return ""
    half_chars = []
    for ch, cnt in counts.items():
        half_chars.extend([ch] * (cnt // 2))
    perms = sorted(list(set(itertools.permutations(half_chars))))
    if k > len(perms): return ""
    left = "".join(perms[k-1])
    mid = odd_chars[0] if odd_chars else ""
    return left + mid + left[::-1]

for tc in test_cases:
    print(f"Running {tc[0]}, {tc[1]}")
    res = solution(tc[0], tc[1])
    print("Result:", res)

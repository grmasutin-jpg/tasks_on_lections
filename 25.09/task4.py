import collections
s = input().lower()
cnt = collections.Counter(list(s))
most_cmn = collections.Counter(list(s)).most_common(3)
print(f"сколько раз встречается каждый симвом в строке: \n {cnt}")
print("самые частые символы:")
for value, count in most_cmn:
    print(f"{value} встречается {count} раз")

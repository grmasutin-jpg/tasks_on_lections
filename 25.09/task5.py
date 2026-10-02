n = int(input())
simple = []
if n >= 2:
    simple.append(2)
i = 3
while i <= n:
    flag = True
    for j in simple:
        if j**2 > i:
            break
        if i % j == 0:
            flag = False
            break
    if flag:
        simple.append(i)
    i += 2

print(simple)

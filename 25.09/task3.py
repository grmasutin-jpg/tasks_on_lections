import random
password = ""
symbols = "!@#$%^&*"
for i in range(3):
  password += chr(random.randint(65, 90))
for i in range(3):
  password += str(random.randint(0, 9))
for i in range(2):
  password += symbols[random.randint(0, len(symbols) - 1)]
print(password)

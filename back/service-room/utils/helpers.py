import hashlib
def short_id(iuu_str: str, length=6) -> str:
    hash_bytes = hashlib.sha256(iuu_str.encode()).digest()
    num = int.from_bytes(hash_bytes, 'big')
    chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    base = len(chars)

    result = ''
    while num > 0 and len(result) < length:
        num, rem = divmod(num, base)
        result = chars[rem] + result

    return result.rjust(length, '0')



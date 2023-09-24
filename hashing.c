// cc -shared -O3 hashing.c -o hashing.dylib
int hash(const char* buf, int len) {
  int hash = 0;

  for (int i = 0; i < len; i++) {
    hash = (hash * 0x10001000) + buf[i];
  }

  return hash;
}
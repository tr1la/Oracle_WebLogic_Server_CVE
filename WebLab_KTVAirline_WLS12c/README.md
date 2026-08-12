# KTVAirline - WebLogic 12c edition

Đây là bản chuyển đổi độc lập của `WebLab_KTVAirline` để deploy backend lên
Oracle WebLogic Server 12.2.1.4. Bản gốc Java 17/Spring Boot 3 không bị thay đổi.

> **Lab only:** ứng dụng chứa các chức năng/lỗ hổng phục vụ thực hành bảo mật.
> Chỉ bind WebLogic vào `127.0.0.1`; không public Admin Console, T3 hoặc ứng dụng
> ra Internet.

## Kiến trúc

- Backend: Java 8 bytecode, Spring Boot 2.7.18, `javax.*`, standard
  application-server WAR (không chứa embedded Tomcat).
- Application server: WebLogic Server 12.2.1.4 / JDK 8.
- Context root: `/ktv-airline`.
- Frontend React: chạy riêng bằng Vite hoặc Nginx, không nằm trong WAR.
- Database: MySQL 8, mặc định publish ở host port `3307`.

## Các thay đổi tương thích

- Spring Boot 3.1.3 -> 2.7.18.
- Java 17 -> target Java 8 (class-file major version 52).
- `jakarta.*` -> `javax.*`.
- API Java 9-17 được thay bằng API Java 8 tương đương.
- Backend đóng gói thành WAR và `SpApplication` kế thừa
  `SpringBootServletInitializer`.
- Tomcat EL và bước đóng gói executable WAR được loại bỏ để WebLogic 12c không
  phải parse Servlet 4.0 `web-fragment.xml`.
- `WEB-INF/weblogic.xml` cấu hình context root, classloader và virtual upload
  directory cho WebLogic.
- WAR ưu tiên `javax.validation.*` của ứng dụng (Bean Validation 2.0), tránh
  WebLogic nạp Bean Validation 1.1 và gây `NoSuchMethodError` khi Hibernate
  Validator khởi động.
- Hành vi JSP lab phụ thuộc Tomcat/Jasper được chuyển sang WebLogic JSP servlet.

## Build backend WAR

Có thể dùng JDK mới để build, nhưng compiler luôn phát hành bytecode Java 8:

```bash
mvn -Dmaven.repo.local=.m2/repository clean package
```

Kết quả:

```text
target/ktv-airline-wls12c.war
```

Nếu build lại trong khi WebLogic container đang chạy, restart hai service
WebLogic để Docker Desktop làm mới metadata của file WAR bind-mounted:

```bash
cd ../weblogic-12.2.1.4-lab
docker compose restart weblogic server0
```

## Chuẩn bị MySQL và frontend

File Compose trong thư mục này chỉ chạy MySQL và frontend; backend không chạy
thành container Spring Boot riêng:

```bash
cp .env.example .env
docker compose up -d mysql frontend
```

- Frontend: `http://127.0.0.1:3000`
- MySQL: `127.0.0.1:3307`
- Vite/Nginx proxy API tới
  `http://127.0.0.1:7003/ktv-airline`.

Chạy frontend bằng Vite trên máy host cũng được:

```bash
cd frontend
npm ci
npm run dev
```

## Chuẩn bị WebLogic container

Lab WebLogic hiện tại nằm tại:

```text
../weblogic-12.2.1.4-lab
```

Trong service `weblogic` của file Compose lab, mount thư mục build:

```yaml
volumes:
  - ../WebLab_KTVAirline_WLS12c/target:/u01/oracle/deployments:ro
```

Backend mặc định kết nối MySQL qua:

```text
jdbc:mysql://host.docker.internal:3307/ktvdb
```

Có thể override bằng các biến `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME` và `SPRING_DATASOURCE_PASSWORD` trong environment
của container WebLogic.

### JWT key

Ứng dụng đọc key từ một trong hai cách:

1. `JWT_PRIVATE_KEY` và `JWT_PUBLIC_KEY` chứa PEM/base64 trực tiếp; hoặc
2. file trong domain persistent:

```text
/u01/oracle/user_projects/domains/base_domain/lab-data/secrets/jwt-private.pem
/u01/oracle/user_projects/domains/base_domain/lab-data/secrets/jwt-public.pem
```

Trên host, từ thư mục bản chuyển đổi, copy hai key lab vào domain persistent
trước khi deploy:

```bash
mkdir -p ../weblogic-12.2.1.4-lab/user_projects/domains/base_domain/lab-data/secrets
cp jwt-private.pem ../weblogic-12.2.1.4-lab/user_projects/domains/base_domain/lab-data/secrets/jwt-private.pem
cp jwt-public.pem ../weblogic-12.2.1.4-lab/user_projects/domains/base_domain/lab-data/secrets/jwt-public.pem
```

Không commit private key thật vào repository.

## Deploy bằng Admin Console

1. Khởi động `Server-0` và xác nhận state là `RUNNING`.
2. Vào **Deployments -> Install**.
3. Chọn `/u01/oracle/deployments/ktv-airline-wls12c.war`.
4. Chọn **Install this deployment as an application**.
5. Target vào `Server-0`, sau đó **Finish** và **Activate Changes**.
6. Vào deployment, chọn **Control -> Start -> Servicing all requests**.

Các URL kiểm tra:

```text
http://127.0.0.1:7003/ktv-airline/swagger-ui/index.html
http://127.0.0.1:7003/ktv-airline/v3/api-docs
http://127.0.0.1:7003/ktv-airline/api/v1/news/all?pageNum=0&pageSize=10
```

Trên WebLogic 12.2.1.4, dùng URL Swagger có `/index.html` như trên. Alias
`/swagger-ui.html` của Springdoc 1.7 có thể trả 500 do resource resolver của
Springdoc xử lý URL của WebLogic không đúng.

## Lưu ý runtime

- `server.tomcat.*` không điều khiển WebLogic access log.
- Dữ liệu file mặc định nằm dưới
  `/u01/oracle/user_projects/domains/base_domain/lab-data`, nên được giữ lại bởi
  bind mount `user_projects` của lab.
- Nếu đổi context root, phải sửa đồng thời `weblogic.xml`, proxy frontend và
  `APP_PUBLIC_BACKEND_URL`.
- WebLogic 12c có thể log `BEA-160248` khi scanner gặp `module-info.class` hoặc
  class Java 9/11 trong multi-release JAR như HikariCP/JAXB. Trong lab hiện tại
  các dòng này không làm deployment thất bại: ứng dụng vẫn khởi động và chuyển
  sang `RUNNING`. Khi gặp 503, kiểm tra tiếp lỗi Spring nằm sau các dòng này và
  xác nhận deployment đã được **Start -> Servicing all requests**.

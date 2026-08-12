-- Thiết lập encoding để hỗ trợ tiếng Việt đầy đủ
SET NAMES 'utf8mb4';

-- Xóa dữ liệu cũ
DELETE FROM `news`;
ALTER TABLE `news` MODIFY COLUMN CONTENT LONGTEXT;
-- Thêm tin tức
INSERT INTO `news` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED,
                    TITLE, AUTHOR, CATEGORY, SUMMARY, CONTENT, PICTURE_LINK)
VALUES
-- TIN TỨC HÀNG KHÔNG
(1, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'KTVAirline mở đường bay mới đến Phú Quốc', 'Admin', 0,
 'KTVAirline vừa công bố mở đường bay mới từ Hà Nội và TP.HCM đến Phú Quốc, tăng cường kết nối du lịch đến đảo ngọc.',
 '<p>KTVAirline chính thức công bố mở đường bay mới từ Hà Nội và TP.HCM đến Phú Quốc từ tháng 7/2024. Với tần suất 2 chuyến/ngày cho mỗi đường bay, KTVAirline kỳ vọng sẽ đáp ứng nhu cầu du lịch ngày càng tăng đến hòn đảo xinh đẹp này.</p>
 <p>Các chuyến bay sẽ được khai thác bằng máy bay hiện đại Airbus A321neo, mang đến trải nghiệm thoải mái và an toàn cho hành khách.</p>
 <p>Lịch bay cụ thể:</p>
 <ul>
   <li>Hà Nội - Phú Quốc: Khởi hành 7:00 và 15:00 hàng ngày</li>
   <li>TP.HCM - Phú Quốc: Khởi hành 8:30 và 16:30 hàng ngày</li>
 </ul>
 <p>Giá vé khởi điểm chỉ từ 799.000đ/chiều, bao gồm 7kg hành lý xách tay.</p>',
 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05'),

(2, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'KTVAirline đạt chứng nhận An toàn Hàng không Quốc tế', 'Admin', 0,
 'Hãng hàng không KTVAirline vừa được cấp chứng nhận An toàn Hàng không Quốc tế sau quá trình đánh giá nghiêm ngặt.',
 '<p>Sau quá trình đánh giá kỹ lưỡng, KTVAirline đã chính thức được cấp chứng nhận An toàn Hàng không Quốc tế, khẳng định cam kết về chất lượng và an toàn trong hoạt động bay.</p>
 <p>Chứng nhận này là minh chứng cho những nỗ lực không ngừng của KTVAirline trong việc nâng cao chất lượng dịch vụ và đảm bảo an toàn cho hành khách.</p>
 <p>Các tiêu chuẩn đạt được:</p>
 <ul>
   <li>Quy trình bảo dưỡng máy bay theo tiêu chuẩn quốc tế</li>
   <li>Đội ngũ phi công và tiếp viên được đào tạo chuyên nghiệp</li>
   <li>Hệ thống quản lý an toàn toàn diện</li>
   <li>Tuân thủ nghiêm ngặt các quy định an toàn hàng không</li>
 </ul>',
 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd'),

(3, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'KTVAirline đầu tư đội bay mới với 10 máy bay Airbus A321neo', 'Admin', 0,
 'Hãng hàng không KTVAirline vừa ký kết hợp đồng mua 10 máy bay Airbus A321neo mới, dự kiến bàn giao từ 2025.',
 '<p>KTVAirline tiếp tục mở rộng đội bay với việc ký kết hợp đồng mua 10 máy bay Airbus A321neo mới. Đây là bước đi chiến lược nhằm nâng cao chất lượng dịch vụ và mở rộng mạng bay.</p>
 <p>Ưu điểm của máy bay A321neo:</p>
 <ul>
   <li>Tiết kiệm nhiên liệu hơn 20% so với thế hệ cũ</li>
   <li>Cabin rộng rãi, thoải mái hơn</li>
   <li>Hệ thống giải trí hiện đại</li>
   <li>Thân thiện với môi trường</li>
 </ul>
 <p>Dự kiến các máy bay mới sẽ được bàn giao từ năm 2025, góp phần nâng cao năng lực vận chuyển của KTVAirline.</p>',
 'https://images.unsplash.com/photo-1562368370-cff10978a647?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

-- KHUYẾN MÃI
(4, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Siêu khuyến mãi: Bay khắp Việt Nam chỉ từ 199.000đ', 'Marketing Team', 1,
 'KTVAirline tung ra chương trình khuyến mãi lớn nhất năm với giá vé chỉ từ 199.000đ cho tất cả các đường bay nội địa.',
 '<p>Nhân dịp hè 2024, KTVAirline triển khai chương trình khuyến mãi "Bay khắp Việt Nam" với giá vé siêu tiết kiệm:</p>
 <ul>
   <li>Giá vé từ 199.000đ cho các chuyến bay nội địa</li>
   <li>Thời gian bay: 01/07/2024 - 31/08/2024</li>
   <li>Thời gian đặt vé: 15/05/2024 - 30/06/2024</li>
 </ul>
 <p>Điều kiện áp dụng:</p>
 <ul>
   <li>Áp dụng cho tất cả các đường bay nội địa</li>
   <li>Không áp dụng cho ngày lễ, Tết</li>
   <li>Số lượng vé có hạn</li>
 </ul>
 <p>Nhanh tay đặt vé để có những chuyến du lịch hè thật đáng nhớ!</p>',
 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e'),

(5, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Ưu đãi đặc biệt: Tặng 2 kiện hành lý ký gửi', 'Marketing Team', 1,
 'Khách hàng đặt vé thương gia sẽ được tặng thêm 2 kiện hành lý ký gửi miễn phí trong tháng 6/2024.',
 '<p>KTVAirline triển khai chương trình ưu đãi đặc biệt dành cho khách hàng đặt vé thương gia:</p>
 <ul>
   <li>Tặng thêm 2 kiện hành lý ký gửi (mỗi kiện 23kg)</li>
   <li>Áp dụng cho tất cả các chuyến bay trong tháng 6/2024</li>
   <li>Không giới hạn số lượng vé mua</li>
 </ul>
 <p>Quyền lợi thương gia:</p>
 <ul>
   <li>Quầy check-in ưu tiên</li>
   <li>Phòng chờ VIP</li>
   <li>Suất ăn cao cấp</li>
   <li>Ghế ngồi rộng rãi</li>
 </ul>
 <p>Đây là cơ hội tuyệt vời để trải nghiệm dịch vụ thương gia với nhiều ưu đãi hấp dẫn!</p>',
 'https://plus.unsplash.com/premium_photo-1675019262990-a4142cfd2432?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

(6, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Khuyến mãi mùa cưới: Ưu đãi cho cặp đôi', 'Marketing Team', 1,
 'KTVAirline ra mắt gói ưu đãi đặc biệt dành cho các cặp đôi trong mùa cưới 2024.',
 '<p>Chương trình "Hạnh phúc trên không" dành cho các cặp đôi:</p>
 <ul>
   <li>Giảm 30% cho cặp vé đôi</li>
   <li>Tặng 30kg hành lý ký gửi/người</li>
   <li>Miễn phí chọn chỗ ngồi</li>
   <li>Ưu tiên check-in và lên máy bay</li>
 </ul>
 <p>Điều kiện áp dụng:</p>
 <ul>
   <li>Đặt vé cùng chuyến bay</li>
   <li>Thời gian bay: 01/06/2024 - 31/12/2024</li>
   <li>Xuất trình giấy đăng ký kết hôn trong vòng 3 tháng</li>
 </ul>',
 'https://images.unsplash.com/photo-1541089404510-5c9a779841fc?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

-- HƯỚNG DẪN
(7, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Hướng dẫn check-in trực tuyến KTVAirline', 'Support Team', 2,
 'Tìm hiểu cách check-in trực tuyến nhanh chóng và thuận tiện với KTVAirline để tiết kiệm thời gian tại sân bay.',
 '<p>Check-in trực tuyến là cách thuận tiện để tiết kiệm thời gian tại sân bay. Dưới đây là các bước check-in:</p>
 <ol>
   <li>Truy cập website KTVAirline</li>
   <li>Chọn mục "Check-in trực tuyến"</li>
   <li>Nhập mã đặt chỗ và họ tên</li>
   <li>Chọn chỗ ngồi (nếu muốn)</li>
   <li>Tải thẻ lên máy bay</li>
 </ol>
 <p>Thời gian check-in:</p>
 <ul>
   <li>Bắt đầu: 24 giờ trước giờ khởi hành</li>
   <li>Kết thúc: 2 giờ trước giờ khởi hành</li>
 </ul>
 <p>Lưu ý quan trọng:</p>
 <ul>
   <li>Cần in thẻ lên máy bay hoặc lưu bản điện tử</li>
   <li>Mang theo giấy tờ tùy thân hợp lệ</li>
   <li>Đến sân bay trước giờ bay ít nhất 90 phút</li>
 </ul>',
 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b'),

(8, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Chính sách hành lý KTVAirline', 'Support Team', 2,
 'Thông tin chi tiết về chính sách hành lý xách tay và ký gửi của KTVAirline.',
 '<p>KTVAirline có chính sách hành lý linh hoạt để đáp ứng nhu cầu của khách hàng:</p>
 <h3>Hành lý xách tay:</h3>
 <ul>
   <li>Hạng phổ thông: 7kg</li>
   <li>Hạng thương gia: 14kg</li>
   <li>Kích thước tối đa: 56cm x 36cm x 23cm</li>
 </ul>
 <h3>Hành lý ký gửi:</h3>
 <ul>
   <li>Hạng phổ thông: 23kg</li>
   <li>Hạng thương gia: 32kg</li>
   <li>Tổng kích thước không quá 158cm (dài + rộng + cao)</li>
 </ul>
 <p>Mua thêm hành lý:</p>
 <ul>
   <li>Trước chuyến bay: Giảm 15% qua website</li>
   <li>Tại sân bay: Theo biểu phí hiện hành</li>
 </ul>
 <p>Vật phẩm cấm mang:</p>
 <ul>
   <li>Chất lỏng trên 100ml trong hành lý xách tay</li>
   <li>Vật sắc nhọn, chất dễ cháy nổ</li>
   <li>Các vật phẩm bị cấm theo quy định hàng không</li>
 </ul>',
 'https://images.unsplash.com/photo-1718702662411-11d9672eb179?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

(9, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Quy trình đổi/hoàn vé KTVAirline', 'Support Team', 2,
 'Hướng dẫn chi tiết về quy trình đổi và hoàn vé tại KTVAirline.',
 '<p>KTVAirline cung cấp dịch vụ đổi/hoàn vé linh hoạt cho khách hàng:</p>
 <h3>Đổi vé:</h3>
 <ul>
   <li>Thực hiện trực tuyến qua website</li>
   <li>Liên hệ tổng đài 1900 xxxx</li>
   <li>Đến văn phòng KTVAirline</li>
 </ul>
 <p>Thời hạn đổi vé:</p>
 <ul>
   <li>Trước 24h: Phí thấp nhất</li>
   <li>Trong 24h: Phí cao hơn</li>
   <li>Sau khi bay: Không được đổi</li>
 </ul>
 <h3>Hoàn vé:</h3>
 <ul>
   <li>Hoàn online qua website</li>
   <li>Hoàn qua tổng đài</li>
   <li>Hoàn tại văn phòng</li>
 </ul>
 <p>Thời gian hoàn tiền: 7-15 ngày làm việc tùy phương thức thanh toán</p>',
 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05'),

(10, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Chương trình khách hàng thân thiết', 'Marketing Team', 2,
 'KTVAirline giới thiệu chương trình khách hàng thân thiết với nhiều đặc quyền hấp dẫn.',
 '<p>Tham gia chương trình khách hàng thân thiết của KTVAirline để nhận nhiều ưu đãi:</p>
 <h3>Các hạng thẻ:</h3>
 <ul>
   <li>Thẻ Bạc: Tích lũy 10 chuyến bay/năm</li>
   <li>Thẻ Vàng: Tích lũy 30 chuyến bay/năm</li>
   <li>Thẻ Bạch Kim: Tích lũy 50 chuyến bay/năm</li>
 </ul>
 <h3>Quyền lợi:</h3>
 <ul>
   <li>Tích điểm đổi vé máy bay</li>
   <li>Ưu tiên check-in, lên máy bay</li>
   <li>Hành lý ký gửi thêm</li>
   <li>Truy cập phòng chờ VIP</li>
 </ul>
 <p>Đặc biệt: Điểm thưởng không bao giờ hết hạn với thẻ Bạch Kim!</p>',
 'https://plus.unsplash.com/premium_photo-1728488389835-2f9568c5d76a?q=80&w=1990&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
 
 -- FLIGHT DEALS (CHUYẾN BAY ƯU ĐÃI)
INSERT INTO `news` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED,
                    TITLE, AUTHOR, CATEGORY, SUMMARY, CONTENT, PICTURE_LINK)
VALUES
(11, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Hà Nội - Đà Nẵng', 'KTVAirline', 3,
 'Việt Nam',
 '1,290,000₫',
 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2070&auto=format&fit=crop'),

(12, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'TP.HCM - Phú Quốc', 'KTVAirline', 3,
 'Việt Nam',
 '990,000₫',
 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?q=80&w=2069&auto=format&fit=crop'),

(13, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Hà Nội - Tokyo', 'KTVAirline', 3,
 'Nhật Bản',
 '5,990,000₫',
 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=2036&auto=format&fit=crop'),

(14, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'TP.HCM - Singapore', 'KTVAirline', 3,
 'Singapore',
 '3,490,000₫',
 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2069&auto=format&fit=crop'),

(15, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Đà Nẵng - Seoul', 'KTVAirline', 3,
 'Hàn Quốc',
 '4,990,000₫',
 'https://images.unsplash.com/photo-1532649097480-b67d52743b69?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

-- PLACES (ĐỊA ĐIỂM DU LỊCH)
(16, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Nghỉ dưỡng tại thiên đường biển đảo', 'InterContinental Phú Quốc', 4,
 'Phú Quốc, Việt Nam',
 'Tận hưởng kỳ nghỉ tuyệt vời tại InterContinental Phú Quốc Long Beach Resort với bãi biển riêng dài 250m, hồ bơi vô cực và spa cao cấp. Trải nghiệm ẩm thực đẳng cấp với nhà hàng sao Michelin và quầy bar với tầm nhìn panorama ra biển.',
 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?q=80&w=2069&auto=format&fit=crop'),

(17, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Khám phá vẻ đẹp cổ kính', 'Anantara Hội An Resort', 4,
 'Hội An, Việt Nam',
 'Nằm bên bờ sông Thu Bồn thơ mộng, Anantara Hội An Resort là điểm dừng chân hoàn hảo để khám phá phố cổ Hội An. Resort mang đậm kiến trúc Đông Dương với những khu vườn nhiệt đới xanh mát và dịch vụ spa truyền thống.',
 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2070&auto=format&fit=crop'),

(18, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Nghỉ dưỡng giữa thiên nhiên', 'Topas Ecolodge', 4,
 'Sapa, Việt Nam',
 'Topas Ecolodge - khu nghỉ dưỡng sinh thái độc đáo nằm trên đỉnh núi với tầm nhìn 360 độ ra thung lũng Mường Hoa. Trải nghiệm không gian yên bình, hòa mình vào thiên nhiên và văn hóa dân tộc vùng cao.',
 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop'),

(19, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Thiên đường nghỉ dưỡng', 'Six Senses Ninh Van Bay', 4,
 'Nha Trang, Việt Nam',
 'Six Senses Ninh Van Bay mang đến trải nghiệm nghỉ dưỡng xa xỉ với các villa riêng biệt, bể bơi vô cực, bãi biển riêng và dịch vụ quản gia 24/7. Tận hưởng ẩm thực organic từ vườn rau hữu cơ và spa đẳng cấp thế giới.',
 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop'),

(20, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Nghỉ dưỡng trên vịnh di sản', 'Paradise Elegance Cruise', 4,
 'Hạ Long, Việt Nam',
 'Du thuyền 5 sao Paradise Elegance mang đến hành trình khám phá vịnh Hạ Long đẳng cấp. Tận hưởng cabin sang trọng với ban công riêng, ẩm thực fusion và các hoạt động thú vị như tập Tai Chi buổi sáng, câu mực đêm.',
 'https://images.unsplash.com/photo-1578530332818-6ba472e67b9f?q=80&w=2072&auto=format&fit=crop');
 
-- Xóa dữ liệu cũ để tránh trùng lặp
DELETE FROM `transaction`;
DELETE FROM `seat`;
DELETE FROM `flight`;
DELETE FROM `plane`;

-- Thêm dữ liệu máy bay
INSERT INTO `plane` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED, 
                  NAME, PRODUCER, DIAGRAM_LINK, SUMMARY)
VALUES
(1, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Airbus A321neo', 'Airbus', 'a321neo.jpg', 'Máy bay thân hẹp hiện đại, sức chứa 180-240 hành khách'),
(2, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Boeing 787-9', 'Boeing', 'b787.jpg', 'Máy bay thân rộng cho đường bay dài, sức chứa 250-290 hành khách'),
(3, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'Airbus A350-900', 'Airbus', 'a350.jpg', 'Máy bay thân rộng tiết kiệm nhiên liệu, sức chứa 300-350 hành khách');

-- Thêm dữ liệu chuyến bay
INSERT INTO `flight` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED, 
                   NAME, PLANE_ID, START_TIME, END_TIME, STATUS, 
                   DEPARTURE, DEPARTURE_CODE, ARRIVAL, ARRIVAL_CODE, GATE)
VALUES
-- Chuyến bay nội địa
(1, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA101', 1, '2026-07-15 07:30:00', '2026-07-15 09:40:00', 0,
 'Hà Nội', 'HAN', 'TP.HCM', 'SGN', 'A1'),

(2, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA102', 1, '2026-07-15 13:10:00', '2026-07-15 15:20:00', 0,
 'TP.HCM', 'SGN', 'Hà Nội', 'HAN', 'B2'),

(3, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA201', 2, '2026-07-16 08:45:00', '2026-07-16 10:05:00', 0,
 'Hà Nội', 'HAN', 'Đà Nẵng', 'DAD', 'C1'),

(4, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA202', 2, '2026-07-16 17:20:00', '2026-07-16 18:40:00', 0,
 'Đà Nẵng', 'DAD', 'Hà Nội', 'HAN', 'C2'),

(5, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA301', 3, '2026-07-17 06:50:00', '2026-07-17 07:55:00', 0,
 'TP.HCM', 'SGN', 'Phú Quốc', 'PQC', 'D1'),

-- Chuyến bay quốc tế
(6, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA501', 2, '2026-07-18 00:20:00', '2026-07-18 07:30:00', 0,
 'Hà Nội', 'HAN', 'Tokyo', 'NRT', 'E1'),

(7, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA502', 2, '2026-07-19 10:30:00', '2026-07-19 14:45:00', 0,
 'Tokyo', 'NRT', 'Hà Nội', 'HAN', 'E2'),

(8, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA601', 3, '2026-07-20 09:10:00', '2026-07-20 12:10:00', 0,
 'TP.HCM', 'SGN', 'Singapore', 'SIN', 'F1'),

(9, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA602', 3, '2026-07-20 16:20:00', '2026-07-20 17:30:00', 0,
 'Singapore', 'SIN', 'TP.HCM', 'SGN', 'F2'),

(10, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'QA701', 3, '2026-07-21 01:15:00', '2026-07-21 07:35:00', 0,
 'Hà Nội', 'HAN', 'Seoul', 'ICN', 'G1');

-- Thêm dữ liệu ghế ngồi
INSERT INTO `seat` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED,
                 NAME, SEAT_TYPE, HAVE_WINDOW, PICTURE_LINK, SUMMARY)
VALUES
-- Ghế hạng thương gia
(1, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'A1', 2, true, 'business_window.jpg', 'Ghế thương gia cạnh cửa sổ'),
(2, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'A2', 2, false, 'business_aisle.jpg', 'Ghế thương gia cạnh lối đi'),
(3, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'B1', 2, true, 'business_window.jpg', 'Ghế thương gia cạnh cửa sổ'),
(4, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'B2', 2, false, 'business_aisle.jpg', 'Ghế thương gia cạnh lối đi'),

-- Ghế hạng phổ thông đặc biệt
(5, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'C1', 1, true, 'premium_window.jpg', 'Ghế phổ thông đặc biệt cạnh cửa sổ'),
(6, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'C2', 1, false, 'premium_middle.jpg', 'Ghế phổ thông đặc biệt giữa'),
(7, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'C3', 1, false, 'premium_aisle.jpg', 'Ghế phổ thông đặc biệt cạnh lối đi'),

-- Ghế hạng phổ thông
(8, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'D1', 0, true, 'economy_window.jpg', 'Ghế phổ thông cạnh cửa sổ'),
(9, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'D2', 0, false, 'economy_middle.jpg', 'Ghế phổ thông giữa'),
(10, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 'D3', 0, false, 'economy_aisle.jpg', 'Ghế phổ thông cạnh lối đi');

INSERT INTO `transaction` (
  ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED,
  USER_ID, FLIGHT_ID, SEAT_ID, STATUS, PRICE
)
VALUES
-- Đặt vé chuyến bay nội địa
(1, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 NULL, 1, 1, 1, 5000000),  -- Hà Nội - TP.HCM, ghế thương gia

(2, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 NULL, 2, 5, 1, 2500000),  -- TP.HCM - Hà Nội, ghế phổ thông đặc biệt

(3, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 NULL, 3, 8, 1, 1500000),  -- Hà Nội - Đà Nẵng, ghế phổ thông

-- Đặt vé chuyến bay quốc tế
(4, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 NULL, 6, 2, 1, 15000000), -- Hà Nội - Tokyo, ghế thương gia

(5, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 NULL, 8, 6, 1, 8000000),  -- TP.HCM - Singapore, ghế phổ thông đặc biệt

(6, 'admin', '2025-06-10', 'admin', '2025-06-10', false,
 NULL, 10, 9, 1, 6000000); -- Hà Nội - Seoul, ghế phổ thông

-- Đồng bộ Hibernate sequence sau khi insert ID thủ công
UPDATE `news_seq` SET next_val = GREATEST(next_val, 21);
UPDATE `plane_seq` SET next_val = GREATEST(next_val, 4);
UPDATE `flight_seq` SET next_val = GREATEST(next_val, 11);
UPDATE `seat_seq` SET next_val = GREATEST(next_val, 11);
UPDATE `transaction_seq` SET next_val = GREATEST(next_val, 7);

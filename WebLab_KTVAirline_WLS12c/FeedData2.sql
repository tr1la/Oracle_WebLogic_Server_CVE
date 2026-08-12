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
(1, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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

(2, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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

(3, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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
(4, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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

(5, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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

(6, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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
(7, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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

(8, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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

(9, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
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

(10, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Chương trình khách hàng thân thiết', 'Marketing Team', 1,
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
(11, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Hà Nội - Đà Nẵng', 'KTVAirline', 3,
 'Việt Nam',
 '1,290,000₫',
 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2070&auto=format&fit=crop'),

(12, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'TP.HCM - Phú Quốc', 'KTVAirline', 3,
 'Việt Nam',
 '990,000₫',
 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?q=80&w=2069&auto=format&fit=crop'),

(13, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Hà Nội - Tokyo', 'KTVAirline', 3,
 'Nhật Bản',
 '5,990,000₫',
 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=2036&auto=format&fit=crop'),

(14, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'TP.HCM - Singapore', 'KTVAirline', 3,
 'Singapore',
 '3,490,000₫',
 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2069&auto=format&fit=crop'),

(15, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Đà Nẵng - Seoul', 'KTVAirline', 3,
 'Hàn Quốc',
 '4,990,000₫',
 'https://images.unsplash.com/photo-1532649097480-b67d52743b69?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

-- PLACES (ĐỊA ĐIỂM DU LỊCH)
(16, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Nghỉ dưỡng tại thiên đường biển đảo', 'InterContinental Phú Quốc', 4,
 'Phú Quốc, Việt Nam',
 'Tận hưởng kỳ nghỉ tuyệt vời tại InterContinental Phú Quốc Long Beach Resort với bãi biển riêng dài 250m, hồ bơi vô cực và spa cao cấp. Trải nghiệm ẩm thực đẳng cấp với nhà hàng sao Michelin và quầy bar với tầm nhìn panorama ra biển.',
 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?q=80&w=2069&auto=format&fit=crop'),

(17, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Khám phá vẻ đẹp cổ kính', 'Anantara Hội An Resort', 4,
 'Hội An, Việt Nam',
 'Nằm bên bờ sông Thu Bồn thơ mộng, Anantara Hội An Resort là điểm dừng chân hoàn hảo để khám phá phố cổ Hội An. Resort mang đậm kiến trúc Đông Dương với những khu vườn nhiệt đới xanh mát và dịch vụ spa truyền thống.',
 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2070&auto=format&fit=crop'),

(18, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Nghỉ dưỡng giữa thiên nhiên', 'Topas Ecolodge', 4,
 'Sapa, Việt Nam',
 'Topas Ecolodge - khu nghỉ dưỡng sinh thái độc đáo nằm trên đỉnh núi với tầm nhìn 360 độ ra thung lũng Mường Hoa. Trải nghiệm không gian yên bình, hòa mình vào thiên nhiên và văn hóa dân tộc vùng cao.',
 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop'),

(19, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Thiên đường nghỉ dưỡng', 'Six Senses Ninh Van Bay', 4,
 'Nha Trang, Việt Nam',
 'Six Senses Ninh Van Bay mang đến trải nghiệm nghỉ dưỡng xa xỉ với các villa riêng biệt, bể bơi vô cực, bãi biển riêng và dịch vụ quản gia 24/7. Tận hưởng ẩm thực organic từ vườn rau hữu cơ và spa đẳng cấp thế giới.',
 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop'),

(20, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Nghỉ dưỡng trên vịnh di sản', 'Paradise Elegance Cruise', 4,
 'Hạ Long, Việt Nam',
 'Du thuyền 5 sao Paradise Elegance mang đến hành trình khám phá vịnh Hạ Long đẳng cấp. Tận hưởng cabin sang trọng với ban công riêng, ẩm thực fusion và các hoạt động thú vị như tập Tai Chi buổi sáng, câu mực đêm.',
 'https://images.unsplash.com/photo-1578530332818-6ba472e67b9f?q=80&w=2072&auto=format&fit=crop');
 
UPDATE `news` SET category = 0 WHERE id IN (1, 2, 3);
UPDATE `news` SET category = 1 WHERE id IN (4, 5, 6);
UPDATE `news` SET category = 2 WHERE id IN (7, 8, 9, 10);
UPDATE `news` SET category = 3 WHERE id IN (11, 12, 13, 14, 15);
UPDATE `news` SET category = 4 WHERE id IN (16, 17, 18, 19, 20);


-- Xóa dữ liệu cũ để tránh trùng lặp
DELETE FROM `transaction`;
DELETE FROM `promotion`;
DELETE FROM `seat`;
DELETE FROM `flight`;
DELETE FROM `plane`;

-- Thêm dữ liệu máy bay
INSERT INTO `plane` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED, 
                  NAME, PRODUCER, DIAGRAM_LINK, SUMMARY)
VALUES
(1, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Airbus A321neo', 'Airbus', 'a321neo.jpg', 'Máy bay thân hẹp hiện đại, phù hợp đường bay nội địa và khu vực'),
(2, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Boeing 787-9 Dreamliner', 'Boeing', 'b787-9.jpg', 'Máy bay thân rộng cho đường bay dài, cabin yên tĩnh và tiết kiệm nhiên liệu'),
(3, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Airbus A350-900', 'Airbus', 'a350-900.jpg', 'Máy bay thân rộng thế hệ mới, khai thác tốt các đường bay quốc tế tầm xa'),
(4, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'ATR 72-600', 'ATR', 'atr72-600.jpg', 'Máy bay turboprop cho đường bay ngắn, tối ưu chi phí vận hành'),
(5, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Embraer E190-E2', 'Embraer', 'e190-e2.jpg', 'Máy bay phản lực khu vực, cabin rộng và linh hoạt cho chặng trung bình'),
(6, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Boeing 737 MAX 8', 'Boeing', 'b737-max8.jpg', 'Máy bay thân hẹp tiết kiệm nhiên liệu cho các đường bay phổ biến'),
(7, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Airbus A330-300', 'Airbus', 'a330-300.jpg', 'Máy bay thân rộng ổn định cho đường bay quốc tế và bay thuê chuyến'),
(8, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'Boeing 777-300ER', 'Boeing', 'b777-300er.jpg', 'Máy bay thân rộng sức chứa lớn cho đường bay dài cao điểm');

-- Thêm dữ liệu chuyến bay
INSERT INTO `flight` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED, 
                   NAME, PLANE_ID, START_TIME, END_TIME, STATUS, 
                   DEPARTURE, DEPARTURE_CODE, ARRIVAL, ARRIVAL_CODE, GATE)
VALUES
-- STATUS ordinal: OPEN=0, CLOSED=1, DELAY=2, CANCEL=3
(1, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA101', 1, '2026-07-03 06:30:00', '2026-07-03 08:45:00', 0,
 'Hà Nội', 'HAN', 'TP.HCM', 'SGN', 'A1'),
(2, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA102', 1, '2026-07-03 10:00:00', '2026-07-03 12:15:00', 0,
 'TP.HCM', 'SGN', 'Hà Nội', 'HAN', 'A2'),
(3, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA201', 6, '2026-07-04 07:20:00', '2026-07-04 08:45:00', 0,
 'Hà Nội', 'HAN', 'Đà Nẵng', 'DAD', 'B1'),
(4, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA202', 6, '2026-07-04 17:30:00', '2026-07-04 18:55:00', 0,
 'Đà Nẵng', 'DAD', 'Hà Nội', 'HAN', 'B2'),
(5, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA301', 5, '2026-07-05 06:50:00', '2026-07-05 08:00:00', 0,
 'TP.HCM', 'SGN', 'Phú Quốc', 'PQC', 'C1'),
(6, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA302', 5, '2026-07-05 19:10:00', '2026-07-05 20:20:00', 1,
 'Phú Quốc', 'PQC', 'TP.HCM', 'SGN', 'C2'),
(7, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA401', 1, '2026-07-06 08:15:00', '2026-07-06 10:05:00', 0,
 'Hà Nội', 'HAN', 'Nha Trang', 'CXR', 'D1'),
(8, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA402', 1, '2026-07-06 15:45:00', '2026-07-06 17:35:00', 0,
 'Nha Trang', 'CXR', 'Hà Nội', 'HAN', 'D2'),
(9, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA451', 4, '2026-07-07 09:00:00', '2026-07-07 10:05:00', 0,
 'TP.HCM', 'SGN', 'Đà Lạt', 'DLI', 'E1'),
(10, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA452', 4, '2026-07-07 16:20:00', '2026-07-07 17:25:00', 0,
 'Đà Lạt', 'DLI', 'TP.HCM', 'SGN', 'E2'),
(11, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA461', 5, '2026-07-08 11:10:00', '2026-07-08 12:25:00', 0,
 'Đà Nẵng', 'DAD', 'Nha Trang', 'CXR', 'F1'),
(12, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA462', 5, '2026-07-08 18:10:00', '2026-07-08 19:25:00', 0,
 'Nha Trang', 'CXR', 'Đà Nẵng', 'DAD', 'F2'),
(13, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA501', 2, '2026-07-10 00:20:00', '2026-07-10 07:30:00', 0,
 'Hà Nội', 'HAN', 'Tokyo', 'NRT', 'G1'),
(14, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA502', 2, '2026-07-11 10:30:00', '2026-07-11 14:45:00', 0,
 'Tokyo', 'NRT', 'Hà Nội', 'HAN', 'G2'),
(15, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA511', 2, '2026-07-12 01:10:00', '2026-07-12 08:20:00', 0,
 'TP.HCM', 'SGN', 'Osaka', 'KIX', 'G3'),
(16, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA512', 2, '2026-07-13 11:15:00', '2026-07-13 15:45:00', 0,
 'Osaka', 'KIX', 'TP.HCM', 'SGN', 'G4'),
(17, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA601', 3, '2026-07-14 09:10:00', '2026-07-14 12:10:00', 0,
 'TP.HCM', 'SGN', 'Singapore', 'SIN', 'H1'),
(18, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA602', 3, '2026-07-14 16:20:00', '2026-07-14 17:30:00', 0,
 'Singapore', 'SIN', 'TP.HCM', 'SGN', 'H2'),
(19, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA701', 3, '2026-07-15 01:15:00', '2026-07-15 07:35:00', 2,
 'Hà Nội', 'HAN', 'Seoul', 'ICN', 'H3'),
(20, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA702', 3, '2026-07-16 12:20:00', '2026-07-16 15:05:00', 0,
 'Seoul', 'ICN', 'Hà Nội', 'HAN', 'H4'),
(21, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA711', 7, '2026-07-17 02:00:00', '2026-07-17 08:10:00', 0,
 'Đà Nẵng', 'DAD', 'Seoul', 'ICN', 'I1'),
(22, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA801', 6, '2026-07-18 08:30:00', '2026-07-18 10:05:00', 0,
 'TP.HCM', 'SGN', 'Bangkok', 'BKK', 'I2'),
(23, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA802', 6, '2026-07-18 14:40:00', '2026-07-18 16:15:00', 0,
 'Bangkok', 'BKK', 'TP.HCM', 'SGN', 'I3'),
(24, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA821', 6, '2026-07-19 07:45:00', '2026-07-19 11:05:00', 0,
 'Hà Nội', 'HAN', 'Taipei', 'TPE', 'I4'),
(25, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA901', 8, '2026-07-21 23:40:00', '2026-07-22 06:55:00', 0,
 'Hà Nội', 'HAN', 'Paris', 'CDG', 'J1'),
(26, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA902', 8, '2026-07-23 13:20:00', '2026-07-24 05:45:00', 0,
 'Paris', 'CDG', 'Hà Nội', 'HAN', 'J2'),
(27, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA931', 7, '2026-07-24 22:30:00', '2026-07-25 10:35:00', 0,
 'TP.HCM', 'SGN', 'Sydney', 'SYD', 'J3'),
(28, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA932', 7, '2026-07-26 12:00:00', '2026-07-26 18:15:00', 0,
 'Sydney', 'SYD', 'TP.HCM', 'SGN', 'J4'),
(29, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA941', 8, '2026-07-27 00:35:00', '2026-07-27 07:50:00', 0,
 'Hà Nội', 'HAN', 'Frankfurt', 'FRA', 'K1'),
(30, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'QA961', 8, '2026-07-28 01:05:00', '2026-07-28 08:35:00', 3,
 'TP.HCM', 'SGN', 'London', 'LHR', 'K2');

-- Thêm dữ liệu ghế ngồi
INSERT INTO `seat` (ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED,
                 NAME, SEAT_TYPE, HAVE_WINDOW, PICTURE_LINK, SUMMARY)
VALUES
-- SEAT_TYPE ordinal: ECONOMY=0, COMFORT=1, BUSINESS=2, FIRST=3
(1, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E01', 0, 1, 'economy_window.jpg', 'Ghế phổ thông cạnh cửa sổ'),
(2, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E02', 0, 0, 'economy_middle.jpg', 'Ghế phổ thông giữa'),
(3, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E03', 0, 0, 'economy_aisle.jpg', 'Ghế phổ thông cạnh lối đi'),
(4, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E04', 0, 1, 'economy_window.jpg', 'Ghế phổ thông cạnh cửa sổ'),
(5, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E05', 0, 0, 'economy_middle.jpg', 'Ghế phổ thông giữa'),
(6, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E06', 0, 0, 'economy_aisle.jpg', 'Ghế phổ thông cạnh lối đi'),
(7, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E07', 0, 1, 'economy_window.jpg', 'Ghế phổ thông cạnh cửa sổ'),
(8, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E08', 0, 0, 'economy_middle.jpg', 'Ghế phổ thông giữa'),
(9, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E09', 0, 0, 'economy_aisle.jpg', 'Ghế phổ thông cạnh lối đi'),
(10, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E10', 0, 1, 'economy_window.jpg', 'Ghế phổ thông cạnh cửa sổ'),
(11, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E11', 0, 0, 'economy_middle.jpg', 'Ghế phổ thông giữa'),
(12, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'E12', 0, 0, 'economy_aisle.jpg', 'Ghế phổ thông cạnh lối đi'),
(13, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'C01', 1, 1, 'comfort_window.jpg', 'Ghế comfort rộng hơn, cạnh cửa sổ'),
(14, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'C02', 1, 0, 'comfort_aisle.jpg', 'Ghế comfort rộng hơn, cạnh lối đi'),
(15, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'C03', 1, 1, 'comfort_window.jpg', 'Ghế comfort rộng hơn, cạnh cửa sổ'),
(16, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'C04', 1, 0, 'comfort_aisle.jpg', 'Ghế comfort rộng hơn, cạnh lối đi'),
(17, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'B01', 2, 1, 'business_window.jpg', 'Ghế thương gia cạnh cửa sổ'),
(18, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'B02', 2, 0, 'business_aisle.jpg', 'Ghế thương gia cạnh lối đi'),
(19, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'B03', 2, 1, 'business_window.jpg', 'Ghế thương gia cạnh cửa sổ'),
(20, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'B04', 2, 0, 'business_aisle.jpg', 'Ghế thương gia cạnh lối đi'),
(21, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'B05', 2, 1, 'business_window.jpg', 'Ghế thương gia cạnh cửa sổ'),
(22, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'B06', 2, 0, 'business_aisle.jpg', 'Ghế thương gia cạnh lối đi'),
(23, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'F01', 3, 1, 'first_suite.jpg', 'Suite hạng nhất cạnh cửa sổ'),
(24, 'admin', '2026-06-10', 'admin', '2026-06-10', 0, 'F02', 3, 0, 'first_suite.jpg', 'Suite hạng nhất cạnh lối đi');

INSERT INTO `transaction` (
  ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED,
  USER_ID, FLIGHT_ID, SEAT_ID, STATUS, PRICE
)
-- STATUS ordinal: BOOKED=0, FREE=1, ONGOING=2, DELAY=3, ONTIME=4, CANCEL=5, HOLD=6
SELECT
  10000 + (flight_ids.ID * 100) + seat_ids.ID AS ID,
  'admin' AS CREATE_BY,
  '2026-06-10' AS CREATE_DATE,
  'admin' AS UPDATE_BY,
  '2026-06-10' AS UPDATE_DATE,
  0 AS IS_DELETED,
  NULL AS USER_ID,
  flight_ids.ID AS FLIGHT_ID,
  seat_ids.ID AS SEAT_ID,
  CASE
    WHEN flight_ids.ID IN (1, 13, 21) AND seat_ids.ID IN (1, 13, 17, 23) THEN 0
    WHEN flight_ids.ID IN (6, 19, 30) AND seat_ids.ID IN (2, 14, 18, 24) THEN 5
    ELSE 1
  END AS STATUS,
  CASE
    WHEN flight_ids.ID BETWEEN 1 AND 12 AND seat_ids.ID BETWEEN 1 AND 12 THEN 1290000
    WHEN flight_ids.ID BETWEEN 1 AND 12 AND seat_ids.ID BETWEEN 13 AND 16 THEN 1890000
    WHEN flight_ids.ID BETWEEN 1 AND 12 AND seat_ids.ID BETWEEN 17 AND 22 THEN 3900000
    WHEN flight_ids.ID BETWEEN 1 AND 12 THEN 5500000
    WHEN flight_ids.ID BETWEEN 13 AND 24 AND seat_ids.ID BETWEEN 1 AND 12 THEN 3490000
    WHEN flight_ids.ID BETWEEN 13 AND 24 AND seat_ids.ID BETWEEN 13 AND 16 THEN 4590000
    WHEN flight_ids.ID BETWEEN 13 AND 24 AND seat_ids.ID BETWEEN 17 AND 22 THEN 8900000
    WHEN flight_ids.ID BETWEEN 13 AND 24 THEN 12900000
    WHEN seat_ids.ID BETWEEN 1 AND 12 THEN 8900000
    WHEN seat_ids.ID BETWEEN 13 AND 16 THEN 12500000
    WHEN seat_ids.ID BETWEEN 17 AND 22 THEN 28000000
    ELSE 42000000
  END AS PRICE
FROM (
  SELECT 1 AS ID UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
  UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
) flight_ids
CROSS JOIN (
  SELECT 1 AS ID UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
) seat_ids;

-- Thêm dữ liệu khuyến mãi đúng schema PROMOTION
INSERT INTO `promotion` (
  ID, CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE, IS_DELETED,
  CODE, TITLE, DESCRIPTION,
  DEPARTURE, DEPARTURE_CODE, ARRIVAL, ARRIVAL_CODE, SEAT_TYPE,
  DISCOUNT_TYPE, DISCOUNT_VALUE, MINIMUM_ORDER_AMOUNT, MAXIMUM_DISCOUNT_AMOUNT,
  START_DATE, END_DATE, USAGE_LIMIT, USED_COUNT, IS_ACTIVE, PICTURE_LINK, TERMS
)
VALUES
(1, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'JULYHANSGN15', 'Giảm 15% Hà Nội - TP.HCM tháng 7',
 'Ưu đãi cho hành khách bay tuyến Hà Nội - TP.HCM trong tháng 7/2026.',
 'Hà Nội', 'HAN', 'TP.HCM', 'SGN', 'ECONOMY',
 'PERCENTAGE', 15.00, 1000000.00, 500000.00,
 '2026-07-01', '2026-07-31', 500, 42, 1, 'promotion-han-sgn.jpg',
 'Áp dụng cho hạng phổ thông, không áp dụng đồng thời với mã khác.'),
(2, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'BUSINESSSIN25', 'Ưu đãi thương gia đi Singapore',
 'Giảm sâu cho hành khách đặt ghế thương gia tuyến TP.HCM - Singapore.',
 'TP.HCM', 'SGN', 'Singapore', 'SIN', 'BUSINESS',
 'PERCENTAGE', 25.00, 5000000.00, 3000000.00,
 '2026-07-01', '2026-07-20', 120, 15, 1, 'promotion-singapore-business.jpg',
 'Áp dụng cho chuyến bay QA601, số lượng có hạn.'),
(3, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'DADCOMFORT20', 'Comfort Đà Nẵng giảm 20%',
 'Mã giảm giá dành cho ghế comfort trên các chặng đi và đến Đà Nẵng.',
 NULL, NULL, 'Đà Nẵng', 'DAD', 'COMFORT',
 'PERCENTAGE', 20.00, 1500000.00, 700000.00,
 '2026-07-01', '2026-07-25', 300, 28, 1, 'promotion-danang-comfort.jpg',
 'Áp dụng với vé có điểm đến Đà Nẵng hoặc khởi hành từ Đà Nẵng.'),
(4, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'FIRSTEU10', 'Suite hạng nhất đi châu Âu',
 'Ưu đãi dành cho khách hàng trải nghiệm hạng nhất trên đường bay châu Âu.',
 'Hà Nội', 'HAN', NULL, NULL, 'FIRST',
 'PERCENTAGE', 10.00, 30000000.00, 6000000.00,
 '2026-07-10', '2026-07-31', 50, 4, 1, 'promotion-first-europe.jpg',
 'Áp dụng cho các chuyến đi Paris hoặc Frankfurt.'),
(5, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'PQC699K', 'Bay Phú Quốc giảm ngay 699K',
 'Giảm trực tiếp cho đường bay TP.HCM - Phú Quốc trong mùa hè.',
 'TP.HCM', 'SGN', 'Phú Quốc', 'PQC', 'ECONOMY',
 'FIXED_AMOUNT', 699000.00, 1200000.00, NULL,
 '2026-07-01', '2026-07-18', 250, 61, 1, 'promotion-phu-quoc.jpg',
 'Không áp dụng cho chuyến đã đóng bán.'),
(6, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'TOKYO12', 'Tokyo mùa hè giảm 12%',
 'Ưu đãi cho khách bay Hà Nội - Tokyo và Tokyo - Hà Nội.',
 NULL, NULL, 'Tokyo', 'NRT', 'ECONOMY',
 'PERCENTAGE', 12.00, 3000000.00, 1200000.00,
 '2026-07-05', '2026-07-31', 200, 33, 1, 'promotion-tokyo.jpg',
 'Áp dụng cho hạng phổ thông và thanh toán trực tuyến.'),
(7, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'SEOULFAMILY800', 'Gia đình đi Seoul giảm 800K',
 'Giảm trực tiếp cho nhóm khách đặt vé đi Seoul trong tháng 7.',
 NULL, NULL, 'Seoul', 'ICN', 'ECONOMY',
 'FIXED_AMOUNT', 800000.00, 5000000.00, NULL,
 '2026-07-01', '2026-07-31', 180, 19, 1, 'promotion-seoul-family.jpg',
 'Áp dụng cho đơn hàng từ hai hành khách trở lên.'),
(8, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'WEEKDAY10', 'Bay ngày thường giảm 10%',
 'Khuyến mãi cho khách linh hoạt lịch bay từ thứ Hai đến thứ Năm.',
 NULL, NULL, NULL, NULL, NULL,
 'PERCENTAGE', 10.00, 1000000.00, 400000.00,
 '2026-07-01', '2026-07-31', 1000, 205, 1, 'promotion-weekday.jpg',
 'Không áp dụng cho cuối tuần và ngày lễ.'),
(9, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'STUDENT500', 'Sinh viên giảm 500K',
 'Ưu đãi cố định cho sinh viên khi đặt vé nội địa.',
 NULL, NULL, NULL, NULL, 'ECONOMY',
 'FIXED_AMOUNT', 500000.00, 1000000.00, NULL,
 '2026-07-01', '2026-07-31', 400, 77, 1, 'promotion-student.jpg',
 'Cần xuất trình thẻ sinh viên khi làm thủ tục.'),
(10, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'EARLYBIRD18', 'Đặt sớm giảm 18%',
 'Ưu đãi dành cho khách đặt vé trước ngày bay tối thiểu 14 ngày.',
 NULL, NULL, NULL, NULL, NULL,
 'PERCENTAGE', 18.00, 1500000.00, 900000.00,
 '2026-07-01', '2026-07-20', 600, 138, 1, 'promotion-early-bird.jpg',
 'Áp dụng khi ngày đặt vé cách ngày bay ít nhất 14 ngày.'),
(11, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'RETURNTRIP1M', 'Khứ hồi tiết kiệm 1 triệu',
 'Giảm trực tiếp khi đặt cặp vé chiều đi và chiều về cùng tuyến.',
 NULL, NULL, NULL, NULL, 'COMFORT',
 'FIXED_AMOUNT', 1000000.00, 3500000.00, NULL,
 '2026-07-01', '2026-07-31', 150, 22, 1, 'promotion-return-trip.jpg',
 'Áp dụng cho hạng comfort, không hoàn đổi mã sau khi dùng.'),
(12, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'BEACHCXR20', 'Nha Trang biển xanh giảm 20%',
 'Ưu đãi cho các chuyến bay đi Nha Trang trong mùa hè.',
 NULL, NULL, 'Nha Trang', 'CXR', 'ECONOMY',
 'PERCENTAGE', 20.00, 1000000.00, 600000.00,
 '2026-07-01', '2026-07-24', 350, 49, 1, 'promotion-nha-trang.jpg',
 'Áp dụng cho chặng đến sân bay Cam Ranh.'),
(13, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'AUSSIE15', 'Sydney mùa hè giảm 15%',
 'Ưu đãi cho hành trình TP.HCM - Sydney và Sydney - TP.HCM.',
 NULL, NULL, 'Sydney', 'SYD', 'BUSINESS',
 'PERCENTAGE', 15.00, 15000000.00, 5000000.00,
 '2026-07-10', '2026-07-31', 80, 9, 1, 'promotion-sydney.jpg',
 'Áp dụng cho hạng thương gia trên các chuyến QA931 và QA932.'),
(14, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'BANGKOK450', 'Bangkok cuối tuần giảm 450K',
 'Giảm trực tiếp cho các chuyến TP.HCM - Bangkok.',
 'TP.HCM', 'SGN', 'Bangkok', 'BKK', 'ECONOMY',
 'FIXED_AMOUNT', 450000.00, 1500000.00, NULL,
 '2026-07-01', '2026-07-28', 220, 38, 1, 'promotion-bangkok.jpg',
 'Áp dụng cho vé thanh toán bằng thẻ nội địa hoặc ví điện tử.'),
(15, 'admin', '2026-06-10', 'admin', '2026-06-10', 0,
 'SPRINGOLD', 'Mã mùa xuân đã hết hạn',
 'Dữ liệu mẫu cho trạng thái promotion không còn hoạt động.',
 NULL, NULL, NULL, NULL, NULL,
 'PERCENTAGE', 8.00, 1000000.00, 300000.00,
 '2026-03-01', '2026-04-15', 100, 100, 0, 'promotion-expired.jpg',
 'Mã đã hết hạn, chỉ dùng để kiểm thử bộ lọc active.');


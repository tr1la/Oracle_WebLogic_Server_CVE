package org.example.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Pageable;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class NewsRequest {
    private String keyword;
    private Integer pageNum;
    private Integer pageSize;
}

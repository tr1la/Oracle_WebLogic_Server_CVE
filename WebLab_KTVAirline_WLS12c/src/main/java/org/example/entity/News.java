package org.example.entity;

import javax.persistence.*;
import lombok.*;
import org.example.constant.Category;

@Table(name = "NEWS")
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class News extends BaseObject{
    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "AUTHOR", nullable = false)
    private String author;

    @Column(name = "CATEGORY", nullable = false)
    private Category category;

    @Column(name = "SUMMARY", nullable = false)
    private String summary;

    @Column(name = "CONTENT", nullable = false)
    private String content;

    @Column(name = "PICTURE_LINK", nullable = false)
    private String pictureLink;
}

package org.example.entity;

import javax.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public class BaseObject {
    @Id
    @GeneratedValue
    @Column(name = "ID")
    private Integer id;

    @CreatedBy
    private String createBy;

    @CreatedDate
    private Date createDate;

    @LastModifiedBy
    private String updateBy;

    @LastModifiedDate
    private Date updateDate;

    private boolean isDeleted = false;
}

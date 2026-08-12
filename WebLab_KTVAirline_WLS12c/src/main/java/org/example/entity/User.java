package org.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.*;
import lombok.*;
import org.example.constant.Role;

import java.sql.Date;

@Table(name = "USER")
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class User extends BaseObject{
    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;

    @Column(name = "PASSWORD", nullable = false)
    @JsonIgnore
    private String password;

    @Column(name = "NAME")
    private String name;

    @Column(name = "ID_NUMBER")
    private String IdNumber;

    @Column(name = "BIRTHDAY")
    private Date birthday ;

    @Column(name = "PHONE_NUMBER")
    private String phoneNum;

    @Column(name = "GENDER")
    private String gender;

    @Column(name = "ADDRESS")
    private String address;

    @Column(name = "AVATAR_URL")
    private String avatarUrl;

    @Column(name = "PROFILE_THEME")
    @Builder.Default
    private String profileTheme = "light_mode.ftl";

    @Column(name = "ROLE", nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "IS_FORGOTTEN", nullable = false)
    @Builder.Default
    private boolean isForgotten = false;
}

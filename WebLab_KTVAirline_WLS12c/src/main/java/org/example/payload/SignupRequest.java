package org.example.payload;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Date;

@Getter
@Setter
public class SignupRequest {

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 40)
    private String password;

    @NotBlank
    private String name;

    private String IdNumber;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date birthday;

    @NotBlank
    private String phoneNum;

    private String gender;

    private String address;
}

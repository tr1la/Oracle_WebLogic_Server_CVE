package org.example.security;

import javax.transaction.Transactional;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try{
            User user = userRepository.findByEmailAndIsDeletedFalse(email);
            return UserDetailsImpl.build(user);
        }catch (Exception e){
            throw new UsernameNotFoundException("User Not Found with username: " + email);
        }
    }

}

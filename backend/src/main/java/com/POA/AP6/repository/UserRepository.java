package com.POA.AP6.repository;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
	Optional<User> findByEmail(String email);

	Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}

package com.madawheels.repository;

import com.madawheels.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    /** Nombre de comptes ayant ce rôle (ex. "CLIENT") — utilisé par le tableau de bord admin. */
    long countByRole(String role);

    /** Liste des comptes d'un rôle donné, les plus récents en premier — page « Clients » de l'admin. */
    List<User> findByRoleOrderByIdDesc(String role);
}
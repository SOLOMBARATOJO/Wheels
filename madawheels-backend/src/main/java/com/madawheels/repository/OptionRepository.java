package com.madawheels.repository;

import com.madawheels.entity.CarOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OptionRepository extends JpaRepository<CarOption, Long> {
}
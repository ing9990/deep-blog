package com.deepblog.minicoupang.domain.category.repository;

import com.deepblog.minicoupang.domain.category.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}

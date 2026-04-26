package com.deepblog.minicoupang.domain.category.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.minicoupang.domain.category.domain.Category;
import com.deepblog.minicoupang.domain.category.repository.CategoryRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CategoryControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    CategoryRepository categoryRepository;

    @BeforeEach
    void seedCategories() {
        categoryRepository.deleteAll();
        categoryRepository.saveAll(List.of(
            Category.create("주방/생활", null),
            Category.create("노트북", null),
            Category.create("신발", null),
            Category.create("키보드", null),
            Category.create("가방", null),
            Category.create("의류", null),
            Category.create("모니터/디스플레이", null),
            Category.create("뷰티", null),
            Category.create("식품", null),
            Category.create("도서", null)
        ));
    }

    @Test
    void list_returns_all_seeded_categories() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items", hasSize(10)))
            .andExpect(jsonPath("$.items[0].name").exists());
    }
}

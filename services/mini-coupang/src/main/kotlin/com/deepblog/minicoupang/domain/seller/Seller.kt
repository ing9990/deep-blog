package com.deepblog.minicoupang.domain.seller

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version

@Entity
@Table(name = "sellers")
class Seller(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, length = 80)
    var name: String,

    @Column(nullable = false, unique = true, length = 200)
    var email: String,

    @Version
    var version: Long = 0,
)

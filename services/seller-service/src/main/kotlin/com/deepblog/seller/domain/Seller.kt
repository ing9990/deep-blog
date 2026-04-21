package com.deepblog.seller.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version

/**
 * Seller 도메인 엔티티.
 *
 * 설계 메모:
 * - `class`(final이 아님) 대신 kotlin-jpa plugin이 open 처리: Hibernate 프록시가 서브클래스로 지연 로딩.
 * - 생성자에 var id = null: JPA 요구사항(기본 생성자)을 kotlin-jpa 플러그인이 자동 제공.
 * - @Version optimistic locking: 여러 요청이 동시에 같은 판매자를 수정할 때 충돌 감지.
 */
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

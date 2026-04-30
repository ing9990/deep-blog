package com.deepblog.notification.domain;

/**
 * 알림 채널 종류. 현재 단계에서 실제 발송은 모두 CONSOLE (로그) 로 한다.
 * 운영 단계에서 SMS/EMAIL/PUSH 가 활성화된다.
 */
public enum NotificationChannel {
    CONSOLE,
    EMAIL,
    SMS,
    PUSH
}

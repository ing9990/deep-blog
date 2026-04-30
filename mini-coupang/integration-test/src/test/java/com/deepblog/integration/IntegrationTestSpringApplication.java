package com.deepblog.integration;

import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

@Suite
@SuiteDisplayName("MSA 통합 테스트")
@SelectPackages("com.deepblog.integration")
public class IntegrationTestSpringApplication {

}

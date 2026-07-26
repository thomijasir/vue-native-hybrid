package com.example.mywebview.app.main

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Test

class BackupRulesTest {
    @Test
    fun secureStorageIsExcludedFromBackupAndDeviceTransfer() {
        val backupRules = File("src/main/res/xml/backup_rules.xml").readText()
        val dataExtractionRules = File("src/main/res/xml/data_extraction_rules.xml").readText()

        assertTrue(backupRules.contains("urb_secure_storage.xml"))
        assertTrue(dataExtractionRules.contains("urb_secure_storage.xml"))
    }
}

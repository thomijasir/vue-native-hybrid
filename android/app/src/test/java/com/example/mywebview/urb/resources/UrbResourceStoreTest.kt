package com.example.mywebview.urb.resources

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class UrbResourceStoreTest {
    @Test
    fun resourceCanOnlyBeConsumedOnce() {
        val file = File.createTempFile("urb-resource", ".txt").apply {
            writeText("payload")
        }
        val store = UrbResourceStore("https://appassets.androidplatform.net")
        val token = store.register(
            UrbResourceStore.Resource(
                file = file,
                fileName = "payload.txt",
                mimeType = "text/plain",
                createdAt = "2026-01-01T00:00:00Z",
                expiresAtMillis = System.currentTimeMillis() + 60_000,
            ),
        )

        val response = store.consume(token)
        assertNotNull(response)
        assertNull(store.consume(token))
    }

    @Test
    fun resourceFileIsDeletedWhenStreamCloses() {
        val file = File.createTempFile("urb-resource", ".txt").apply {
            writeText("payload")
        }
        val store = UrbResourceStore("https://appassets.androidplatform.net")
        val resource = UrbResourceStore.Resource(
            file = file,
            fileName = "payload.txt",
            mimeType = "text/plain",
            createdAt = "2026-01-01T00:00:00Z",
            expiresAtMillis = System.currentTimeMillis() + 60_000,
        )

        val text = store.openResourceStream(resource).bufferedReader().use { it.readText() }

        assertEquals("payload", text)
        assertFalse(file.exists())
    }

    @Test
    fun responseHeadersUseConfiguredOrigin() {
        val store = UrbResourceStore("http://10.0.2.2:8080")
        val headers = store.responseHeaders("pay\"load\n.txt")

        assertEquals("http://10.0.2.2:8080", headers["Access-Control-Allow-Origin"])
        assertEquals("no-store", headers["Cache-Control"])
        assertEquals("inline; filename=\"pay_load_.txt\"", headers["Content-Disposition"])
    }
}

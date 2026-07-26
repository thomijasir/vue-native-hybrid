package com.example.mywebview.urb.commands.securestorage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

private const val SECURE_STORAGE_NAME = "urb_secure_storage"

class SecureStorage(
    context: Context,
) {
    private val appContext = context.applicationContext
    private val preferences: SharedPreferences by lazy {
        EncryptedSharedPreferences.create(
            appContext,
            SECURE_STORAGE_NAME,
            MasterKey.Builder(appContext)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build(),
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun set(key: String, value: String): Boolean {
        return preferences.edit().putString(key, value).commit()
    }

    fun get(key: String): String? {
        return preferences.getString(key, null)
    }

    fun delete(key: String): Boolean {
        return preferences.edit().remove(key).commit()
    }

    fun clear(): Boolean {
        return preferences.edit().clear().commit()
    }
}

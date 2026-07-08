package com.altos.distributor

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WebViewScreen("https://altos-mou-mukherjee.onrender.com/")
        }
    }
}

@Composable
fun WebViewScreen(url: String) {
    var webView: WebView? by remember { mutableStateOf(null) }
    val backDispatcher = LocalOnBackPressedDispatcherOwner.current?.onBackPressedDispatcher

    DisposableEffect(backDispatcher) {
        val callback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView?.canGoBack() == true) {
                    webView?.goBack()
                } else {
                    isEnabled = false
                    backDispatcher?.onBackPressed()
                }
            }
        }
        backDispatcher?.addCallback(callback)
        onDispose {
            callback.remove()
        }
    }

    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                loadUrl(url)
                webView = this
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

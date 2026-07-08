package com.altos.distributor

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import java.io.File
import java.io.FileOutputStream

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WebViewScreen("https://altos-mou-mukherjee.onrender.com/")
        }
    }
}

class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun downloadFile(base64Data: String, fileName: String, mimeType: String) {
        try {
            val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
            val directory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val file = File(directory, fileName)
            val os = FileOutputStream(file)
            os.write(decodedBytes)
            os.close()

            // Notify MediaScanner
            val intent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
            intent.data = Uri.fromFile(file)
            context.sendBroadcast(intent)

            // Trigger DownloadManager notification for visibility
            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.addCompletedDownload(fileName, "Downloaded via Altos App", true, mimeType, file.absolutePath, file.length(), true)

            (context as? MainActivity)?.runOnUiThread {
                Toast.makeText(context, "PDF Downloaded to Downloads folder", Toast.LENGTH_LONG).show()
            }
        } catch (e: Exception) {
            (context as? MainActivity)?.runOnUiThread {
                Toast.makeText(context, "Download failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
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
                addJavascriptInterface(WebAppInterface(context), "AndroidInterface")

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                        val urlString = request?.url?.toString() ?: return false

                        if (urlString.startsWith("whatsapp://") || urlString.contains("wa.me") ||
                            urlString.startsWith("tel:") || urlString.startsWith("mailto:")) {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(urlString))
                                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                context.startActivity(intent)
                                return true
                            } catch (e: Exception) {
                                Toast.makeText(context, "App not installed", Toast.LENGTH_SHORT).show()
                                return true
                            }
                        }
                        return false
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        // Inject script to bridge web download to Android
                        val script = """
                            (function() {
                                const originalDownloadReceipt = window.downloadReceipt;
                                window.downloadReceipt = async function(orderId) {
                                    const token = getAdminToken();
                                    if (!token) { alert('Admin not logged in.'); return; }
                                    try {
                                        const response = await fetch('/api/orders/' + orderId + '/receipt', {
                                            headers: { Authorization: 'Bearer ' + token }
                                        });
                                        if (!response.ok) throw new Error('Download failed');
                                        const blob = await response.blob();
                                        const reader = new FileReader();
                                        reader.onloadend = function() {
                                            const base64data = reader.result.split(',')[1];
                                            AndroidInterface.downloadFile(base64data, 'receipt-' + orderId + '.pdf', 'application/pdf');
                                        }
                                        reader.readAsDataURL(blob);
                                    } catch (e) {
                                        alert(e.message);
                                    }
                                };
                            })();
                        """.trimIndent()
                        view?.evaluateJavascript(script, null)
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                        return super.onJsAlert(view, url, message, result)
                    }

                    override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                        return super.onJsConfirm(view, url, message, result)
                    }

                    override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message?): Boolean {
                        val result = view?.hitTestResult
                        val data = result?.extra
                        if (data != null) {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(data))
                            context.startActivity(intent)
                        }
                        return false
                    }
                }

                setDownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
                    if (url.startsWith("blob:")) return@setDownloadListener
                    val request = DownloadManager.Request(Uri.parse(url))
                    request.setMimeType(mimetype)
                    request.addRequestHeader("User-Agent", userAgent)
                    request.setDescription("Downloading file...")
                    request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype))
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimetype))

                    val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    dm.enqueue(request)
                    Toast.makeText(context, "Downloading File...", Toast.LENGTH_LONG).show()
                }

                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                settings.javaScriptCanOpenWindowsAutomatically = true
                settings.setSupportMultipleWindows(true)
                settings.databaseEnabled = true
                settings.loadWithOverviewMode = true
                settings.useWideViewPort = true

                loadUrl(url)
                webView = this
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

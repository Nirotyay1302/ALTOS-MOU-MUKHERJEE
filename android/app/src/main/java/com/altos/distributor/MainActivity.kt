package com.altos.distributor

import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import java.io.File
import java.io.FileOutputStream

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize().statusBarsPadding()
                ) {
                    WebViewScreen("file:///android_asset/index.html")
                }
            }
        }
    }
}

class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun downloadFile(base64Data: String, fileName: String, mimeType: String) {
        try {
            val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { os ->
                        os.write(decodedBytes)
                    }
                }
            } else {
                val directory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val file = File(directory, fileName)
                FileOutputStream(file).use { os ->
                    os.write(decodedBytes)
                }
                @Suppress("DEPRECATION")
                val intent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
                intent.data = Uri.fromFile(file)
                context.sendBroadcast(intent)
            }

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

                        if (urlString.startsWith("whatsapp://") || urlString.contains("wa.me") || urlString.contains("api.whatsapp.com") ||
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
                        try {
                            val injectionScript = """
                                (function() {
                                    window.sendAdminWhatsApp = function(orderId) {
                                        const order = (window.adminOrders || []).find(o => o.id === orderId);
                                        if (!order) {
                                            alert('Order details not found! Please refresh.');
                                            return;
                                        }
                                        const customerPhone = order.customerPhone || order.phone || '';
                                        const raw = String(customerPhone).replace(/\D/g, '').replace(/^0+/, '');
                                        let waNumber = raw;
                                        if (waNumber.length === 10) waNumber = '91' + waNumber;
                                        if (!waNumber) {
                                            alert('Customer phone number is missing for Order ' + orderId);
                                            return;
                                        }
                                        const lines = [];
                                        lines.push('Thank you for purchasing from Altos. Your order will be delivered soon!');
                                        lines.push('--- Order Details ---');
                                        lines.push('Order ID: ' + order.id);
                                        if (order.items && order.items.length > 0) {
                                            lines.push('Items:');
                                            order.items.forEach(it => {
                                                const rate = it.mrp ?? it.price ?? 0;
                                                const unit = it.unit || 'unit';
                                                lines.push('- ' + it.name + ' (' + unit + ') x' + it.quantity + ' @ ₹' + Number(rate).toFixed(2));
                                            });
                                        }
                                        if (order.paymentMethod === 'cod') {
                                            lines.push('Convenience Fee (COD): ₹30.00');
                                        }
                                        lines.push('Total Amount: ₹' + Number(order.total || 0).toFixed(2));
                                        lines.push('Payment Method: ' + (order.paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery (COD)'));
                                        if (order.paymentMethod === 'upi' && order.transactionId) {
                                            lines.push('UPI Transaction ID: ' + order.transactionId);
                                        }
                                        lines.push('Thanking you,');
                                        lines.push('Mou Mukherjee');
                                        lines.push('(3875042)');
                                        const message = encodeURIComponent(lines.join('\n'));
                                        const waLink = 'https://api.whatsapp.com/send?phone=' + waNumber + '&text=' + message;
                                        window.location.href = waLink;
                                    };
                                    
                                    const originalDownloadReceipt = window.downloadReceipt;
                                    window.downloadReceipt = async function(orderId) {
                                        const token = typeof getAdminToken === 'function' ? getAdminToken() : localStorage.getItem('adminToken');
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
                                                if (window.AndroidInterface && window.AndroidInterface.downloadFile) {
                                                    AndroidInterface.downloadFile(base64data, 'receipt-' + orderId + '.pdf', 'application/pdf');
                                                }
                                            }
                                            reader.readAsDataURL(blob);
                                        } catch (e) {
                                            alert(e.message);
                                        }
                                    };

                                    window.clearBuyNow = function() { localStorage.removeItem('altosBuyNow'); };
                                    window.getBuyNowProduct = function() {
                                        const raw = localStorage.getItem('altosBuyNow');
                                        if (!raw) return null;
                                        try { return JSON.parse(raw); } catch (e) { return { id: raw, qty: 1 }; }
                                    };
                                    setInterval(() => {
                                        const btn = document.getElementById('checkout-button');
                                        if (btn && !btn.dataset.fixedCart) {
                                            btn.dataset.fixedCart = 'true';
                                            btn.onclick = () => { window.clearBuyNow(); };
                                        }
                                    }, 500);
                                })();
                            """.trimIndent()
                            view?.evaluateJavascript(injectionScript, null)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
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
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(data))
                                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                Toast.makeText(context, "Could not open link", Toast.LENGTH_SHORT).show()
                            }
                            return true
                        }
                        val newWebView = WebView(context)
                        newWebView.webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(v: WebView?, req: WebResourceRequest?): Boolean {
                                val urlStr = req?.url?.toString() ?: return false
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(urlStr))
                                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Could not open link", Toast.LENGTH_SHORT).show()
                                }
                                return true
                            }
                        }
                        val transport = resultMsg?.obj as? WebView.WebViewTransport
                        transport?.webView = newWebView
                        resultMsg?.sendToTarget()
                        return true
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
                @Suppress("DEPRECATION")
                settings.allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                settings.allowUniversalAccessFromFileURLs = true
                settings.javaScriptCanOpenWindowsAutomatically = true
                settings.setSupportMultipleWindows(false)
                settings.databaseEnabled = true
                settings.loadWithOverviewMode = true
                settings.useWideViewPort = true
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                settings.textZoom = 100

                loadUrl(url)
                webView = this
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

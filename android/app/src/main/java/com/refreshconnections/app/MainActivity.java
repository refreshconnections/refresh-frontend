package com.refreshconnections.app;

import com.getcapacitor.BridgeActivity;
import android.webkit.CookieManager;
import android.graphics.Color;
import android.os.Bundle;



public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }

  @Override
  public void onPause() {
    super.onPause();
    CookieManager.getInstance().flush();
  }
}

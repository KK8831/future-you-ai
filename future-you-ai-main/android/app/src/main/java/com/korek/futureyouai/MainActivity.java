package com.korek.futureyouai;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.os.Bundle;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.BridgeActivity;
import java.util.Calendar;
import java.util.Map;

@CapacitorPlugin(name = "ScreenTime")
class ScreenTimePlugin extends Plugin {

    @PluginMethod
    public void getScreenTime(PluginCall call) {
        Context context = getContext();
        if (!hasUsagePermission(context)) {
            JSObject result = new JSObject();
            result.put("permissionRequired", true);
            call.resolve(result);
            return;
        }
        try {
            UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
            Calendar cal = Calendar.getInstance();
            long endTime = cal.getTimeInMillis();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            long startTime = cal.getTimeInMillis();
            Map<String, UsageStats> stats = usm.queryAndAggregateUsageStats(startTime, endTime);
            long totalMs = 0;
            for (UsageStats us : stats.values()) {
                totalMs += us.getTotalTimeInForeground();
            }
            double hours = totalMs / 3600000.0;
            JSObject result = new JSObject();
            result.put("screenTimeHours", Math.round(hours * 10.0) / 10.0);
            result.put("permissionRequired", false);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get screen time: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private boolean hasUsagePermission(Context context) {
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            context.getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ScreenTimePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
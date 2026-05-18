package com.eous.aimentor;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        Integer streak = call.getInt("streak");
        Integer level = call.getInt("level");
        Integer xp = call.getInt("xp");

        if (streak == null || level == null) {
            call.reject("Streak and Level are required");
            return;
        }

        Context context = getContext();
        SharedPreferences sharedPref = context.getSharedPreferences("StreakWidgetPref", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putInt("streak", streak);
        editor.putInt("level", level);
        editor.putInt("xp", xp != null ? xp : 0);
        editor.apply();

        // Trigger widget refresh
        StreakWidgetProvider.updateWidget(context);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}

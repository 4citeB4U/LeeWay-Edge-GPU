package industries.leeway.gpu;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.content.Intent;
import android.content.ComponentName;
import android.content.ServiceConnection;
import android.util.Log;
import android.graphics.Color;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Switch;

public final class MainActivity extends Activity {
    private ServiceConnection connection;
    private TextView line(LinearLayout root,String text,int size,int color){
        TextView view=new TextView(this);
        view.setText(text);view.setTextSize(size);view.setTextColor(color);view.setPadding(0,12,0,12);
        root.addView(view,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.WRAP_CONTENT));
        return view;
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);root.setPadding(36,40,36,24);
        root.setBackgroundColor(Color.rgb(12,20,35));root.setGravity(Gravity.TOP);
        line(root,"LEEWAY GPU",28,Color.WHITE);
        line(root,"Standalone GPU service • Android",18,Color.rgb(124,203,255));
        line(root,"DEVICE  "+Build.MANUFACTURER+" "+Build.MODEL,16,Color.WHITE);
        line(root,"BACKEND  Vulkan (diagnostic)",16,Color.WHITE);
        line(root,"Formula → LDWMD → Continuum → Native GPU → Veritas",16,Color.rgb(124,203,255));
        boolean opted=getSharedPreferences("leeway_gpu",MODE_PRIVATE).getBoolean("requestedEnabled",false);
        Switch select=new Switch(this);
        select.setText("Use LeeWay GPU");select.setTextSize(21);select.setTextColor(Color.WHITE);
        select.setContentDescription("Use LeeWay GPU preference switch");
        select.setPadding(0,22,0,22);select.setChecked(opted);
        root.addView(select,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.WRAP_CONTENT));
        TextView preference=line(root,opted?"ON requested — dispatch not authorized":"OFF — normal device GPU unchanged",16,Color.rgb(124,203,255));
        select.setOnCheckedChangeListener((button,checked)->{
            boolean persisted=getSharedPreferences("leeway_gpu",MODE_PRIVATE).edit()
                .putBoolean("requestedEnabled",checked).commit();
            preference.setText(persisted?
                (checked?"ON requested — dispatch not authorized":"OFF — normal device GPU unchanged"):
                "Preference write failed");
            Log.i("LeeWayGpuStatus",persisted?(checked?"GPU_PREFERENCE_ON_DISPATCH_LOCKED":"GPU_PREFERENCE_OFF"):"GPU_PREFERENCE_SAVE_FAILED");
        });
        TextView ipc=line(root,"Service IPC: connecting",15,Color.rgb(124,203,255));
        line(root,"GPU EXECUTION  BLOCKED",20,Color.rgb(255,178,105));
        line(root,"Runtime Fabric issuer, approved Formula scheduling, owner-bound Continuum and Veritas are not production-connected.",15,Color.WHITE);
        line(root,"Switching ON requests LeeWay processing for compatible registered apps. It does not replace Android Vulkan drivers or bypass authorization.",14,Color.LTGRAY);
        setContentView(root);
        connection=new ServiceConnection(){
            @Override public void onServiceConnected(ComponentName component,IBinder binder){
                Messenger remote=new Messenger(binder);
                Message request=Message.obtain(null,GpuCapabilityService.GET_STATUS);
                request.replyTo=new Messenger(new Handler(Looper.getMainLooper()){
                    @Override public void handleMessage(Message reply){
                        Bundle result=reply.getData();
                        boolean match="leeway.gpu.service".equals(result.getString("serviceId"))
                            &&!result.getBoolean("dispatchAllowed",true)
                            &&result.getBoolean("requestedEnabled",!select.isChecked())==select.isChecked();
                        ipc.setText(match?"Service IPC: connected (execution locked)":"Service IPC: preference / identity mismatch");
                        Log.i("LeeWayGpuStatus",match?"SERVICE_BIND_PASS_LOCKED":"SERVICE_BIND_FAILED");
                    }
                });
                try{remote.send(request);}catch(RemoteException e){ipc.setText("Service IPC: unavailable");}
            }
            @Override public void onServiceDisconnected(ComponentName component){
                ipc.setText("Service IPC: disconnected");
            }
        };
        bindService(new Intent(this,GpuCapabilityService.class),connection,BIND_AUTO_CREATE);
    }
    @Override protected void onDestroy(){
        if(connection!=null){unbindService(connection);connection=null;}
        super.onDestroy();
    }
}
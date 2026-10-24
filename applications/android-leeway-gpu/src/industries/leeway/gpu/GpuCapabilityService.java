package industries.leeway.gpu;

import android.app.Service;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;

public final class GpuCapabilityService extends Service {
    public static final int GET_STATUS=1;
    public static final int EXECUTE=2;
    private final Messenger endpoint=new Messenger(new Handler(Looper.getMainLooper()){
        @Override public void handleMessage(Message incoming){
            if(incoming.replyTo==null)return;
            Message response=Message.obtain();
            Bundle data=new Bundle();
            if(incoming.what==GET_STATUS){
                data.putString("serviceId","leeway.gpu.service");
                data.putString("apiVersion","leeway.gpu.service.v1");
                data.putString("backend","VULKAN");
                data.putBoolean("productionReady",false);
                data.putBoolean("dispatchAllowed",false);
                boolean requested=getSharedPreferences("leeway_gpu",MODE_PRIVATE).getBoolean("requestedEnabled",false);
                data.putBoolean("requestedEnabled",requested);
                data.putBoolean("active",false);
                data.putString("effectiveMode",requested?"REQUESTED_NOT_AUTHORIZED":"OFF");
                data.putString("authority","CANONICAL_GPU_ISSUER_UNBOUND");
                data.putString("continuum","LIVE_OWNER_BINDING_UNVERIFIED");
                response.what=GET_STATUS;
            }else{
                data.putString("status","DENIED");
                data.putString("code","GPU_CANONICAL_EXECUTION_AUTHORITY_NOT_CONNECTED");
                data.putBoolean("dispatchExecuted",false);
                response.what=EXECUTE;
            }
            response.setData(data);
            try{incoming.replyTo.send(response);}catch(RemoteException ignored){}
        }
    });
    @Override public IBinder onBind(Intent intent){return endpoint.getBinder();}
}
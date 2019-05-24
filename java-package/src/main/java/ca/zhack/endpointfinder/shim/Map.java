package ca.zhack.endpointfinder.shim;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

/**
 * The JavaScript "Map" object isn't supported yet in Rhino.
 * 
 * This is an implementation that behaves in the same way as the JavaScript "Map" class.
 */
public class Map extends ScriptableObject {

	private java.util.Map<Object, Object> internalMap = new HashMap<Object, Object>();
	
	public static Object jsConstructor(Context cx, Object[] args, Function functionObject, boolean isNew) {
		if (args.length > 0 && args[0] instanceof Map) {
			Map copy = new Map();
			for(Entry<Object, Object> v : ((Map)args[0]).internalMap.entrySet()) {
				copy.internalMap.put(v.getKey(), v.getValue());
			}
			return copy;
		} else {
			return new Map();
		}
	}
	
	@Override
	public String getClassName() {
		return "Map";
	}

	@JSFunction
	public void set(Object key, Object value) {
		internalMap.put(key, value);
	}
	
	@JSFunction
	public boolean has(Object key) {
		return internalMap.containsKey(key);
	}
	
	@JSFunction
	public Object get(Object key) {
		Object res = internalMap.get(key);
		
		if (res == null) {
			return Undefined.instance;
		}
		
		return res;
	}
	
	@JSFunction
	public void delete(Object key) {
		internalMap.remove(key);
	}
	
	@JSFunction
	public int size() {
		return internalMap.size();
	}
	
	@JSFunction
	public void forEach(Object param) {
		Callable callback = (Callable) param;
		
		// Create a temporary list of the content to avoid ConcurentModification exception.
		List<Entry<Object, Object>> vals = new ArrayList<Entry<Object, Object>>();
		for(Entry<Object, Object> v : internalMap.entrySet()) {
			vals.add(v);
		}
		
		for (Entry<Object, Object> v : vals) {
			callback.call(Context.getCurrentContext(), (Scriptable) callback, this, new Object[] { v.getValue(), v.getKey(), this });
		}
	}
	
}

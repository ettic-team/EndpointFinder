package ca.zhack.endpointfinder;


import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.util.Scanner;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import ca.zhack.endpointfinder.shim.Map;

public class EndpointFinder {
	private static String ENDPOINT_FINDER_SCRIPT;
	
	static {
		try {
			InputStream input = EndpointFinder.class.getResourceAsStream("/ca/zhack/endpointfinder/main.js");
			Scanner s = new Scanner(input).useDelimiter("\\A");
			ENDPOINT_FINDER_SCRIPT = s.next();
			s.close();
		} catch (Exception e) {
			System.out.println("Failed to read the main file ...");
			throw new RuntimeException("Unable to load the main script of endpoint finder. Something is wrong with the JAR.", e);
		}
		
		try {
			Class.forName(RelaxedContextFactory.class.getName());
		} catch (Exception e) {
			throw new RuntimeException("Can't find ContextFactory.", e);
		}
	}
	
	public static EndpointResult getEndpoints(String code) {
		EndpointResult result = new EndpointResult();
		
		// Custom context to allow some features.
		Context cx = new RelaxedContextFactory().enterContext();
		
		// Use EcmaScript 1.7
		cx.setLanguageVersion(Context.VERSION_1_7);
		
		// Needed to initialize the JavaScript context
		Scriptable scope = cx.initStandardObjects();
		
		try {
			ScriptableObject.defineClass(scope, Map.class);
			ScriptableObject.defineProperty(scope, "System", System.out, 0);
		} catch (IllegalAccessException | InstantiationException | InvocationTargetException e) {
			// This should never occur unless the code is broken.
			throw new RuntimeException(e);
		}
		
		// Initialize the main script that contains the getEndpoints function
		cx.evaluateString(scope, ENDPOINT_FINDER_SCRIPT, "MainScript", 1, null);
		Scriptable module = (Scriptable) scope.get("module", scope);
		Function fnctGetEndpoints = (Function) module.get("getEndpoints", module);
		
		// Invokes and gather the result.
		NativeArray jsResult = (NativeArray) fnctGetEndpoints.call(cx, scope, null, new String[] { code });
		
		for (int i=0; i<jsResult.getLength(); i++) {
			NativeObject entry = (NativeObject) jsResult.get(i);
			String path = entry.get("output").toString();
			NativeArray listUnknown = (NativeArray) entry.get("unknownPosition");
			
			EndpointEntry ep = new EndpointEntry(path);
			
			for (int j=0; j<listUnknown.getLength(); j++) {
				NativeObject posEntry = (NativeObject) listUnknown.get(j);
				Integer start = (Integer) posEntry.get("start");
				Integer end = (Integer) posEntry.get("end");
				ep.getUnknownPosition().add(new Position(start, end));
			}
			
			result.getEntries().add(ep);
		}
		
		return result;
	}
}

package ca.zhack.endpointfinder;


import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import ca.zhack.endpointfinder.shim.Map;

public class EndpointFinder {
	private static String ENDPOINT_FINDER_SCRIPT;
	
	static {
		try {
			URL mainURL = EndpointFinder.class.getClassLoader().getResource("main.js");
			Path mainPath = Paths.get(mainURL.toURI());
			ENDPOINT_FINDER_SCRIPT = new String(Files.readAllBytes(mainPath));
		} catch (Exception e) {
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
			String entry = Context.toString(jsResult.get(i, jsResult));
			result.getEntries().add(new EndpointEntry(entry));
		}
		
		return result;
	}
}

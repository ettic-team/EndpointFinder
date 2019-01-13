package ca.zhack.endpointfinder;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;

public class RelaxedContextFactory extends ContextFactory {

    static {
        // Initialize GlobalFactory with custom factory
        ContextFactory.initGlobal(new RelaxedContextFactory());
    }
    
    public boolean hasFeature(Context cx, int featureIndex) {
        switch (featureIndex) {
            case Context.FEATURE_MEMBER_EXPR_AS_FUNCTION_NAME:
                return true;

            case Context.FEATURE_RESERVED_KEYWORD_AS_IDENTIFIER:
                return true;
        }
        
        return super.hasFeature(cx, featureIndex);
    }
}
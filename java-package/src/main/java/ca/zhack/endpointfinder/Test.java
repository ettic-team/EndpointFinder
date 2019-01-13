package ca.zhack.endpointfinder;

public class Test {

	public static void main(String[] args) {
		EndpointResult result = EndpointFinder.getEndpoints("$.get(\"/test1\")");
		
		System.out.println(result.getEntries().get(0).getPath());
	}

}

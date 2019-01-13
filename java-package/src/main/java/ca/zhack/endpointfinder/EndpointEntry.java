package ca.zhack.endpointfinder;

public class EndpointEntry {
	private String path;
	
	public EndpointEntry() {
		
	}

	public EndpointEntry(String path) {
		super();
		this.path = path;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}	
}

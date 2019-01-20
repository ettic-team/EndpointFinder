package ca.zhack.endpointfinder;

import java.util.ArrayList;
import java.util.List;

public class EndpointEntry {
	private String path;
	private List<Position> unknownPosition = new ArrayList<Position>();
	
	public EndpointEntry() {
		
	}

	public EndpointEntry(String path) {
		super();
		this.path = path;
	}
	
	public EndpointEntry(String path, List<Position> unknownPosition) {
		super();
		this.path = path;
		this.unknownPosition = unknownPosition;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}

	public List<Position> getUnknownPosition() {
		return unknownPosition;
	}

	public void setUnknownPosition(List<Position> unknownPosition) {
		this.unknownPosition = unknownPosition;
	}
}

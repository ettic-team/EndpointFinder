package ca.zhack.endpointfinder;

import java.util.ArrayList;
import java.util.List;

public class EndpointResult {
	private List<EndpointEntry> entries = new ArrayList<EndpointEntry>();

	public EndpointResult() {
		
	}

	public List<EndpointEntry> getEntries() {
		return entries;
	}
}

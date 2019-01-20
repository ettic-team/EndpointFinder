package ca.zhack.endpointfinder;

public class Position {
	private int start;
	private int end;
	
	public Position() {
		
	}
	
	public Position(int start, int end) {
		super();
		this.start = start;
		this.end = end;
	}

	public int getStart() {
		return start;
	}
	
	public void setStart(int start) {
		this.start = start;
	}
	
	public int getEnd() {
		return end;
	}
	
	public void setEnd(int end) {
		this.end = end;
	}
}

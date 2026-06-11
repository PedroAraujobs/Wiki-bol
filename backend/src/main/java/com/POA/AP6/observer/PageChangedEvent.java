package com.POA.AP6.observer;

import com.POA.AP6.model.Page;
import com.POA.AP6.model.PageChangeType;
import com.POA.AP6.model.User;

public record PageChangedEvent(
		Page page,
		User editedBy,
		PageChangeType changeType,
		String changeSummary
) {
}

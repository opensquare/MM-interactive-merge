{
	docBase: "/merge",
	libraries: ["js/im.js"],
	formLists: {
		main: [
			{id: "initialisation", url: "initialisation.html",
				actions: [
					{
						name: "next",
						submission: {
								url: "{{$end-point-jobs-xml}}/{{//merge/jobId}}",
								method: "get",
								resultInsertPoint: "/merge/jobDetails"
						}
					}
				]
			},
			{id: "jobValidity", url: "check-job-validity.html", docBase:"/merge/jobDetails/job", 
				actions: [
					"stop:invalidJob", 
					{
						name: "next",
						target: "loadOutstandingTemplates",
						dataDocTransform: "xslt/formatJobData.xsl",
						submissions: [
							{
								url: "{{$end-point-jobs}}/{{//merge/jobId}}/payload",
								method: "get",
								resultInsertPoint: "/merge/payload",
								postTransform: "xslt/removeNamespaces.xsl"
							},
							{
								url: "{{$end-point-templates}}/{{//mmJob//template/fileName}}/fieldsXML",
								method: "get",
								resultInsertPoint: "/merge/templates/next",
								postTransform: "xslt/ifl.xsl"
							},
							{
								url: "http://localhost:8080{{$contextPath}}/echo",
								method: "post",
								data: {
									echoData: "[dataDocument]",
									paramToEcho: "echoData"
								},
								postTransform: "xslt/nextTemplate.xsl",
								resultInsertPoint: "/"
							}
						]
					}
					
				]
			},
			{id: "loadOutstandingTemplates", url: "outstanding-templates.html", docBase: "/merge/templateLoader",
				actions: [
					{
						name: "proceed",
						target: "interactiveMerge",
						submissions: [
							{
								url: "http://localhost:8080{{$contextPath}}/echo",
								method: "post",
								data: {
									echoData: "[dataDocument]",
									paramToEcho: "echoData"
								},
								postTransform: "xslt/formatTemplates.xsl",
								resultInsertPoint: "/"
							},
							{
								url: "http://localhost:8080{{$contextPath}}/echo",
								method: "post",
								data: {
									echoData: "[dataDocument]",
									paramToEcho: "echoData"
								},
								postTransform: "xslt/formatJobData.xsl",
								resultInsertPoint: "/"
							},
						]
					},
					{
						name: "addTemplate",
						target: "loadOutstandingTemplates",
						submissions: [
							{
								url: "{{$end-point-templates}}/{{//nextTemplate/file}}/fieldsXML",
								method: "get",
								resultInsertPoint: "/merge/templates/next",
								postTransform: "xslt/ifl.xsl"
							},
							{
								url: "http://localhost:8080{{$contextPath}}/echo",
								method: "post",
								data: {
									echoData: "[dataDocument]",
									paramToEcho: "echoData"
								},
								postTransform: "xslt/nextTemplate.xsl",
								resultInsertPoint: "/"
							}
						]
					}
				]
			},
			{id: "invalidJob", url: "invalid-job.html"},
			{id: "interactiveMerge", url: "merge-fields.html", docBase: "/merge/interactive", 
				actions:[
					"subrecord:subrecords.editSubrecord(index=?)",
					{
						name: "reload",
						target: "interactiveMerge"
					},
					{
						name: "preview",
						target: "interactiveMerge",
						submission: {
							url: "{{$end-point-submit}}",
							method: "post",
							preTransform: "xslt/submitJob.xsl",
							data: {
								username: "xpath://merge/jobDetails//username",
								description: "xpath://merge/interactive/imPreviewDescription",
								searchTerms: "xpath://merge/interactive/searchTerms",
								jobType: "MERGE",
								payload: "[dataDocument]"
							},
							resultInsertPoint: "/merge/previewJob"
						}
					},
					{
						name: "submit",
						target: "previewCheck"
					}
				]
			},
			{id: "previewCheck", url: "submit-direction.html", docBase: "/merge/interactive",
				actions: [
					{
						name: "combinedMerge",
						target: "checkJobSucceeded",
						submission: {
							url: "{{$end-point-submit}}",
							method: "post",
							preTransform: "xslt/submitJob.xsl",
							data: {
								username: "xpath://merge/jobDetails//username",
								description: "xpath://merge/interactive/imDescription",
								searchTerms: "xpath://merge/interactive/searchTerms",
								jobType: "COMBINED",
								payload: "[dataDocument]"
							},
							resultInsertPoint: "/merge/submitResult"
						}
					},
					{
						name: "deliveryOnly",
						target: "checkJobSucceeded",
						submission: {
							url: "{{$end-point-submit}}",
							method: "post",
							preTransform: "xslt/deliverOnly.xsl",
							data: {
								username: "xpath://merge/jobDetails//username",
								description: "xpath://merge/interactive/imDescription",
								searchTerms: "xpath://merge/interactive/searchTerms",
								jobType: "DELIVERY",
								payload: "[dataDocument]"
							},
							resultInsertPoint: "/merge/submitResult"
						}
					}
				]
			},
			{id: "checkJobSucceeded", url: "check-job-submitted.html", docBase: "/merge",
				actions: [
					{
						name: "completeJob",
						target: "jobComplete",
						submission: {
							url: "{{$end-point-complete}}/{{//jobDetails//id}}",
							method: "get",
							resultInsertPoint: "/merge/complete"
						}
					},
					{
						name: "failJob",
						target: "jobComplete",
					}
				]
			},
			{id: "jobComplete", url: "job-complete.html", docBase: "/merge"}
		],
		subrecords: [
			{id: "editSubrecord", url: "edit-subrecord.html", docBase: "/merge/interactive/data/record/subrecord[index]", actions: ["back", "next"]}
	]
	}
}
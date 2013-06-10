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
						submission: {
							url: "http://localhost:8080{{$contextPath}}/echo",
							method: "post",
							data: {
								echoData: "[dataDocument]",
								paramToEcho: "echoData"
							},
							postTransform: "xslt/formatJobData.xsl",
							resultInsertPoint: "/"
						}
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
					{
						name: "reload",
						target: "interactiveMerge"
					},
					{
						name: "preview",
						target: "interactiveMerge"/*,
						submission: {
							url: "{{$end-point-submit}}",
							method: "post",
							preTransform: "xslt/submitJob.xsl",
							data: {
								username: "xpath://merge/jobDetails//username",
								description: "xpath://merge/interactive/imDescription",
								searchTerms: "xpath://merge/interactive/searchTerms",
								jobType: "MERGE",
								payload: "[dataDocument]"
							}
						}*/
					},
					{
						name: "submit",
						target: "previewCheck"
					}
				]
			},
			{id: "previewCheck", url: "submit-direction.html", 
				actions: [
					{
						name: "combinedMerge",
						target: "jobComplete",
						submissions: [
							{
								url: "{{$end-point-submit}}",
								method: "post",
								preTransform: "xslt/submitJob.xsl",
								data: {
									username: "xpath://merge/jobDetails//username",
									description: "xpath://merge/interactive/imDescription",
									searchTerms: "xpath://merge/interactive/searchTerms",
									jobType: "COMBINED",
									payload: "[dataDocument]"
								}
							},
							{
								url: "{{$end-point-complete}}/{{//jobDetails//id}}",
								method: "get"
							}
						]
					},
					{
						name: "deliveryOnly",
						target: "jobComplete",
						submissions: [
							/*{
								url: "{{$end-point-submit}}",
								method: "post",
								preTransform: "",
								data: {
									username: "IM",
									description: "xpath://merge/interactive/imDescription",
									searchTerms: "xpath://merge/interactive/searchTerms",
									jobType: "DELIVERY",
									payload: "[dataDocument]"
								}
							},
							{
								url: "{{$end-point-complete}}/{{//jobDetails//id}}",
								method: "get",
								resultInsertPoint: "/merge/complete"
							}*/
						]
					}
				]
			},
			{id: "jobComplete", url: "job-complete.html"}
		]
	}
}
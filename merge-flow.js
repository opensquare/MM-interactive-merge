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
						target: "interactiveMerge",
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
								resultInsertPoint: "/merge/ifl"
							},
							{
								url: "{{$appPath}}/echo",
								method: "post",
								data: {
									echoData: "[dataDocument]",
									paramToEcho: "echoData"
								},
								postTransform: "xslt/formatJobData.xsl",
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
									username: "IM",
									description: "xpath://merge/interactive/imDescription",
									searchTerms: "xpath://merge/interactive/searchTerms",
									jobType: "COMBINED",
									payload: "[dataDocument]"
								}
							},
							{
								url: "{{$end-point-complete}}/{{//jobDetails//id}}",
								method: "get",
								resultInsertPoint: "/merge/complete"
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